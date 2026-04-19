import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { 
      orderId, 
      paymentMethodId, 
      token, 
      installments, 
      payerEmail,
      amount,
      paymentType,
      identification
    } = await req.json()

    // Initialize Supabase Admin Client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const MP_ACCESS_TOKEN = Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN')
    const isPix = paymentMethodId === 'pix'
    const idempotencyKey = crypto.randomUUID()

    let result: any
    let mpResponse: Response

    if (isPix) {
      // ── PIX: use /v1/payments (Direct Payments API) ─────────────
      // Consistent with card payment and easier to handle identification.
      const mpPaymentData = {
        transaction_amount: Number(Number(amount).toFixed(2)),
        payment_method_id: "pix",
        description: `Pedido Void Drip #${orderId.slice(0, 8)}`,
        external_reference: orderId,
        payer: {
          email: payerEmail,
          first_name: payerEmail.split('@')[0],
          last_name: "Void User",
          identification: identification,
        },
      }

      console.log("Creating Pix Payment:", JSON.stringify(mpPaymentData))

      mpResponse = await fetch('https://api.mercadopago.com/v1/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Idempotency-Key': idempotencyKey,
          'Authorization': `Bearer ${MP_ACCESS_TOKEN}`
        },
        body: JSON.stringify(mpPaymentData)
      })

      result = await mpResponse.json()

    } else {
      // ── CARD: use /v1/payments (Direct Payments API) ─────────────
      // This is the correct API for Bricks-tokenized cards.
      const mpPaymentData: any = {
        transaction_amount: Number(Number(amount).toFixed(2)),
        token: token,
        description: `Pedido Void Drip #${orderId.slice(0, 8)}`,
        installments: Number(installments) || 1,
        payment_method_id: paymentMethodId,
        external_reference: orderId,
        payer: {
          email: payerEmail,
          ...(identification ? { identification } : {}),
        },
      }

      console.log("Creating Card Payment:", JSON.stringify(mpPaymentData))

      mpResponse = await fetch('https://api.mercadopago.com/v1/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Idempotency-Key': idempotencyKey,
          'Authorization': `Bearer ${MP_ACCESS_TOKEN}`
        },
        body: JSON.stringify(mpPaymentData)
      })

      result = await mpResponse.json()
    }

    if (!mpResponse.ok) {
      console.error('MERCADO PAGO ERROR DETAIL:', JSON.stringify(result, null, 2))
      return new Response(
        JSON.stringify({ 
          error: result.message || "Erro ao processar pagamento",
          details: result.cause || result.error_details || []
        }), 
        { status: mpResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ── Map MP status → internal order status ────────────────────────
    // /v1/payments: status = "approved" | "in_process" | "rejected" | "pending"
    // /v1/orders:   status = "processed" | "rejected" | "pending" | "action_required"
    // NOTE: For PIX, "action_required" means QR code generated, AWAITING payment — NOT paid!
    let orderStatus = 'pending'
    const s = result.status

    if (
      s === 'approved' ||
      (s === 'processed' && ['accredited', 'authorized'].includes(result.status_detail ?? ''))
    ) {
      orderStatus = 'paid'
    } else if (s === 'in_process' || s === 'pending' || s === 'authorized' || s === 'action_required') {
      // 'action_required' = PIX QR code generated, user still needs to pay
      orderStatus = 'pending'
    } else if (s === 'rejected' || s === 'cancelled' || s === 'refunded' || s === 'charged_back') {
      orderStatus = 'failed'
    }

    // Update Order
    await supabase
      .from('orders')
      .update({ 
        status: orderStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId)

    // Insert Transaction
    await supabase
      .from('transactions')
      .insert({
        order_id: orderId,
        payment_id: String(result.id),
        payment_method: paymentMethodId,
        status: s,
        amount: amount,
        installments: Number(installments) || 1,
        gateway_response: result
      })

    // Return a normalised envelope so the front-end can reliably check status
    return new Response(
      JSON.stringify({ ...result, status: s }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error("Internal Error:", error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
