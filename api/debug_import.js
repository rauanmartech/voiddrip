import mercadopago from 'mercadopago';
console.log('mercadopago:', typeof mercadopago);
if (typeof mercadopago === 'object') {
  console.log('Keys:', Object.keys(mercadopago));
}
