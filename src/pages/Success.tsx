import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle2, ShoppingBag, ArrowRight, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useCart } from "@/contexts/CartContext";

export default function Success() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("external_reference") || searchParams.get("orderId");
  const { clearCart } = useCart();
  
  useEffect(() => {
    // Mercadopago returns to this page after successful payment
    // We should clear the cart here
    clearCart();
    window.scrollTo(0, 0);
  }, [clearCart]);

  const deliveryDate = new Date();
  deliveryDate.setDate(deliveryDate.getDate() + 4);
  const formattedDelivery = deliveryDate.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div className="min-h-screen bg-[#030303] text-white flex flex-col pt-20">
      <Navbar />
      <main className="flex-grow container mx-auto px-6 py-20 flex flex-col items-center text-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-24 h-24 bg-primary/20 rounded-full flex items-center justify-center text-primary mb-8"
        >
          <CheckCircle2 size={48} />
        </motion.div>
        
        <h1 className="font-display text-4xl uppercase tracking-[0.2em] mb-4">PAGAMENTO APROVADO</h1>
        <p className="text-muted-foreground mb-12 max-w-md tracking-widest text-[10px] uppercase font-bold">
          Sua transação foi processada com sucesso. O vazio agora faz parte do seu estilo.
          {orderId && <span className="block mt-4 text-white">PEDIDO #{orderId.slice(0, 8)}</span>}
        </p>

        <Card className="w-full max-w-md bg-white/[0.02] border-white/10 p-8 space-y-6 text-left mb-12">
            <div className="flex items-center gap-3 text-primary">
              <Truck size={18} />
              <span className="font-display text-xs tracking-widest uppercase font-bold">ENTREGA ESTIMADA: {formattedDelivery}</span>
            </div>
            <div className="h-[1px] w-full bg-white/5" />
            <p className="text-[9px] text-white/40 leading-relaxed uppercase tracking-widest">
              Você receberá um e-mail com os detalhes do rastreamento em breve.
            </p>
        </Card>

        <div className="flex flex-col sm:flex-row gap-4">
          <Button asChild className="h-14 px-12 bg-white text-black hover:bg-primary font-display font-bold tracking-[0.3em]">
            <Link to="/perfil">VER MEUS PEDIDOS</Link>
          </Button>
          <Button asChild variant="outline" className="h-14 px-12 border-white/10 hover:bg-white/5 font-display font-bold tracking-[0.3em]">
            <Link to="/">CONTINUAR COMPRANDO <ArrowRight size={16} className="ml-2" /></Link>
          </Button>
        </div>
      </main>
      <Footer />
    </div>
  );
}
