import { MercadoPagoConfig, Order } from 'mercadopago';

const client = new MercadoPagoConfig({ 
  accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN 
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({ error: 'Order ID is required' });
    }

    const order = new Order(client);

    // Cancel the order in Mercado Pago
    const result = await order.update({
      id: orderId,
      body: {
        status: 'cancelled'
      }
    });

    return res.status(200).json(result);
  } catch (error) {
    console.error('Mercado Pago Cancel Order Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
