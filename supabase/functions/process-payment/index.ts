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
      fullName,
      amount,
      identification
    } = await req.json()

    const MP_ACCESS_TOKEN = Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN')
    
    if (!MP_ACCESS_TOKEN) {
      throw new Error("MERCADO_PAGO_ACCESS_TOKEN não configurado no Supabase.")
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const isPix = paymentMethodId === 'pix'
    const idempotencyKey = crypto.randomUUID()

    // Lógica para separar nome e sobrenome
    const cleanName = fullName || payerEmail.split('@')[0]
    const nameParts = cleanName.trim().split(/\s+/)
    const firstName = nameParts[0] || "Cliente"
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : "VoidDrip"

    const mpPaymentData: any = {
      transaction_amount: Number(Number(amount).toFixed(2)),
      payment_method_id: isPix ? "pix" : paymentMethodId,
      token: isPix ? undefined : token,
      description: `Pedido Void Drip #${orderId.slice(0, 8)}`,
      installments: isPix ? undefined : (Number(installments) || 1),
      external_reference: orderId,
      payer: {
        email: payerEmail,
        first_name: firstName,
        last_name: lastName,
        identification: identification,
      }
    }

    console.log(`Processando ${isPix ? 'Pix' : 'Cartão'} para: ${firstName} ${lastName}`)

    const mpResponse = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Idempotency-Key': idempotencyKey,
        'Authorization': `Bearer ${MP_ACCESS_TOKEN}`
      },
      body: JSON.stringify(mpPaymentData)
    })

    const result = await mpResponse.json()

    if (!mpResponse.ok) {
      console.error('ERRO MERCADO PAGO:', JSON.stringify(result, null, 2))
      return new Response(
        JSON.stringify({ 
          error: result.message || "Erro no Mercado Pago",
          mp_detail: result
        }), 
        { status: mpResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Mapeamento de Status
    let orderStatus = 'pending'
    if (result.status === 'approved') orderStatus = 'paid'

    await supabase.from('orders').update({ status: orderStatus }).eq('id', orderId)
    await supabase.from('transactions').insert({
      order_id: orderId,
      payment_id: String(result.id),
      payment_method: paymentMethodId,
      status: result.status,
      amount: amount,
      gateway_response: result
    })

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error("Erro na Function:", error.message)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
