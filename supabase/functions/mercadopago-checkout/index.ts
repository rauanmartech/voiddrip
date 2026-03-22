import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { MercadoPagoConfig, Preference } from 'npm:mercadopago'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { orderId, items, buyerData } = await req.json()

    // Initialize Supabase Admin Client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // INITIALIZING THE MERCADO PAGO SDK
    const MP_ACCESS_TOKEN = Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN')
    const client = new MercadoPagoConfig({ accessToken: MP_ACCESS_TOKEN });
    const preference = new Preference(client);

    // Map items to Mercado Pago format
    const mpItems = items.map((item: any) => ({
      id: item.product.id,
      title: `${item.product.name} (${item.size || 'Padrão'})`,
      unit_price: Number(item.product.price),
      quantity: Number(item.quantity),
      currency_id: 'BRL',
      picture_url: item.product.image_url?.split(',')[0]
    }))

    // Detect browser origin or fallback
    const origin = req.headers.get('origin') || 'https://yoursite.com'

    // CREATE PREFERENCE
    const result = await preference.create({
      body: {
        items: mpItems,
        payer: {
          name: buyerData.fullName?.split(' ')[0] || 'Cliente',
          surname: buyerData.fullName?.split(' ').slice(1).join(' ') || 'Void',
          email: buyerData.email,
        },
        external_reference: orderId,
        back_urls: {
          success: `${origin}/success`,
          failure: `${origin}/failure`,
          pending: `${origin}/pending`,
        },
        auto_return: 'approved',
        payment_methods: {
          installments: 12,
        }
      }
    });

    // Save Preference ID to Order
    await supabase
      .from('orders')
      .update({ mercado_pago_preference_id: result.id })
      .eq('id', orderId);

    return new Response(
      JSON.stringify({ 
        checkoutUrl: result.init_point,
        preferenceId: result.id
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
