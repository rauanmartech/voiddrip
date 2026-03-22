import { loadMercadoPago } from "@mercadopago/sdk-js";

/**
 * Initialize Mercado Pago with the public key from environment variables.
 * Make sure to add VITE_MERCADO_PAGO_PUBLIC_KEY to your .env.local
 */
export const initMercadoPago = async () => {
  const publicKey = import.meta.env.VITE_MERCADO_PAGO_PUBLIC_KEY;
  
  if (!publicKey || publicKey === "YOUR_PUBLIC_KEY") {
    console.warn("Mercado Pago Public Key NOT set in .env.local");
    return null;
  }

  try {
    await loadMercadoPago();
    const mp = new window.MercadoPago(publicKey, {
      locale: "pt-BR",
    });
    return mp;
  } catch (error) {
    console.error("Error loading Mercado Pago SDK:", error);
    return null;
  }
};

declare global {
  interface Window {
    MercadoPago: any;
  }
}
