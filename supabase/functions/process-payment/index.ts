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
      amount
    } = await req.json()

    // Initialize Supabase Admin Client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const MP_ACCESS_TOKEN = Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN')
    
    // 1. Check if order exists and belongs to user (optional validation)
    
    const isPix = paymentMethodId === 'pix'
    
    // 2. CREATE ORDER IN MERCADO PAGO (Checkout API /v1/orders)
    const idempotencyKey = crypto.randomUUID()
    
    const mpOrderData = {
      type: "online",
      processing_mode: "automatic",
      total_amount: String(amount.toFixed(2)),
      external_reference: orderId,
      payer: {
        email: payerEmail,
        // Optional identification for Pix
        ...(isPix && {
          first_name: payerEmail.split('@')[0], // Fallback if name not passed
          last_name: "Void User"
        })
      },
      transactions: {
        payments: [
          {
            amount: String(amount.toFixed(2)),
            payment_method: {
              id: paymentMethodId,
              type: isPix ? "bank_transfer" : "credit_card",
              ...(isPix ? {} : { token: token, installments: Number(installments) })
            },
            ...(isPix && { expiration_time: "PT7M" })
          }
        ]
      }
    }

    console.log("Creating MP Order:", JSON.stringify(mpOrderData))

    const response = await fetch('https://api.mercadopago.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Idempotency-Key': idempotencyKey,
        'Authorization': `Bearer ${MP_ACCESS_TOKEN}`
      },
      body: JSON.stringify(mpOrderData)
    })

    const result = await response.json()
    console.log("MP Response:", JSON.stringify(result))

    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: result.message || "Erro ao processar pagamento" }), 
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 3. Register Transaction and Update Order in Supabase
    let orderStatus = 'pending'
    if (result.status === 'processed' && (result.status_detail === 'accredited' || result.status_detail === 'authorized')) {
      orderStatus = 'paid'
    } else if (result.status === 'rejected') {
      orderStatus = 'failed'
    }

    // Update Order
    await supabase
      .from('orders')
      .update({ 
        status: orderStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId);

    // Insert Transaction
    await supabase
      .from('transactions')
      .insert({
        order_id: orderId,
        payment_id: result.id,
        payment_method: paymentMethodId,
        status: result.status,
        amount: amount,
        installments: Number(installments),
        gateway_response: result
      });

    return new Response(
      JSON.stringify(result),
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
