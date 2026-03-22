import { MercadoPagoConfig, Order } from 'mercadopago';
import crypto from 'crypto';

// Initialize with Access Token from environment variables
const client = new MercadoPagoConfig({ 
  accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN 
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { 
      items, 
      buyer, 
      paymentMethod, 
      cardToken, 
      installments, 
      issuerId, 
      paymentMethodId, 
      paymentTypeId,
      orderId // UUID from Supabase
    } = req.body;

    const order = new Order(client);

    const totalAmount = items.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);

    const transactions = {
      payments: [
        {
          amount: totalAmount.toFixed(2),
          payment_method: {}
        }
      ]
    };

    if (paymentMethod === 'pix') {
      transactions.payments[0].payment_method = {
        id: 'pix',
        type: 'bank_transfer'
      };
    } else {
      // Credit Card or other method from Brick
      transactions.payments[0].payment_method = {
        id: paymentMethodId,
        type: paymentTypeId || 'credit_card',
        token: cardToken,
        installments: parseInt(installments) || 1
      };
      
      if (issuerId) {
        transactions.payments[0].payment_method.issuer_id = issuerId;
      }
    }

    const payload = {
      body: {
        type: 'online',
        total_amount: totalAmount.toFixed(2),
        external_reference: orderId, // Use Supabase Order UUID
        processing_mode: 'automatic',
        payer: {
          email: buyer.email,
          first_name: buyer.firstName,
          last_name: buyer.lastName,
          identification: {
            type: buyer.identificationType,
            number: buyer.identificationNumber
          }
        },
        transactions
      },
      requestOptions: {
        idempotencyKey: crypto.randomUUID()
      }
    };

    const result = await order.create(payload);

    // If Pix, extract the QR code and ticket information
    const pixPayment = result.transactions?.payments?.find(p => p.payment_method.type === 'bank_transfer');
    
    // Extract transaction/payment ID from Mercado Pago
    const paymentId = result.transactions?.payments?.[0]?.id || result.id;

    return res.status(200).json({ 
      id: result.id,
      payment_id: paymentId,
      status: result.status,
      status_detail: result.status_detail,
      pix: pixPayment ? {
        qr_code: pixPayment.payment_method.qr_code,
        qr_code_base64: pixPayment.payment_method.qr_code_base64,
        ticket_url: pixPayment.payment_method.ticket_url
      } : null,
      gateway_response: result // Full response for client-side storage
    });
  } catch (error) {
    console.error('Mercado Pago Checkout Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
