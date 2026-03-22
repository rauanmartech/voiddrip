const { MercadoPagoConfig, PaymentMethods } = require('mercadopago');

const client = new MercadoPagoConfig({ 
  accessToken: 'APP_USR-5290857371833044-032209-4b538b377b28035f77f6ad2e5c4018dc-3284095606' 
});
const paymentMethods = new PaymentMethods(client);

paymentMethods.get().then((result) => {
  console.log(JSON.stringify(result, null, 2));
}).catch((error) => {
  console.error(error);
});
