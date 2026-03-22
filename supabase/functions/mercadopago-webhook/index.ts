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
    const url = new URL(req.url)
    const topic = url.searchParams.get('topic') || url.searchParams.get('type')
    const id = url.searchParams.get('id') || url.searchParams.get('data.id')

    if (!id || (topic !== 'payment' && topic !== 'merchant_order')) {
       return new Response(JSON.stringify({ message: 'Ignoring topic' }), { status: 200 })
    }

    // 1. Initialize Supabase Service Client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const MP_ACCESS_TOKEN = Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN')

    // 2. Fetch Details from Mercado Pago
    let paymentData: any = {};
    if (topic === 'payment') {
      const response = await fetch(`https://api.mercadopago.com/v1/payments/${id}`, {
        headers: { 'Authorization': `Bearer ${MP_ACCESS_TOKEN}` }
      })
      paymentData = await response.json()
    }

    const orderId = paymentData.external_reference
    const status = paymentData.status // approved, rejected, pending, in_process, etc.
    const paymentId = String(paymentData.id)

    if (orderId && status) {
       // 3. Update Order
       const orderStatus = status === 'approved' ? 'paid' : (status === 'rejected' ? 'failed' : 'pending')
       
       await supabase
         .from('orders')
         .update({ 
           status: orderStatus, 
           payment_status: status,
           updated_at: new Date().toISOString()
         })
         .eq('id', orderId)

       // 4. Log Transaction
       await supabase.from('transactions').upsert({
         order_id: orderId,
         payment_id: paymentId,
         payment_method: paymentData.payment_method_id,
         status: status,
         amount: paymentData.transaction_amount,
         installments: paymentData.installments,
         gateway_response: paymentData,
         updated_at: new Date().toISOString()
       }, { onConflict: 'payment_id' })

       console.log(`Order ${orderId} updated to ${orderStatus} (MP ID: ${paymentId})`)
    }

    return new Response(JSON.stringify({ message: 'OK' }), { headers: corsHeaders, status: 200 })

  } catch (error) {
    console.error('Webhook Error:', error.message)
    return new Response(JSON.stringify({ error: error.message }), { status: 400 })
  }
})
