import mercadopago from 'mercadopago';
const { MercadoPagoConfig, PaymentMethod } = mercadopago;

const accessToken = 'APP_USR-5290857371833044-032209-4b538b377b28035f77f6ad2e5c4018dc-3284095606';

const client = new MercadoPagoConfig({ 
  accessToken: accessToken
});

const pm = new PaymentMethod(client);

pm.get().then((results) => {
  const summary = results.map(curr => ({
    id: curr.id,
    name: curr.name,
    payment_type_id: curr.payment_type_id,
    status: curr.status,
    thumbnail: curr.thumbnail,
  }));
  console.log(JSON.stringify(summary, null, 2));
}).catch((error) => {
  console.error(error);
});
