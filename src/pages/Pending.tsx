import { useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Clock, Info, ArrowRight, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function Pending() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("external_reference") || searchParams.get("orderId");

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-[#030303] text-white flex flex-col pt-20">
      <Navbar />
      <main className="flex-grow container mx-auto px-6 py-20 flex flex-col items-center text-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-24 h-24 bg-orange-500/10 rounded-full flex items-center justify-center text-orange-500 mb-8 border border-orange-500/20"
        >
          <Clock size={48} className="animate-pulse" />
        </motion.div>
        
        <h1 className="font-display text-4xl uppercase tracking-[0.2em] mb-4">PAGAMENTO EM ANÁLISE</h1>
        <p className="text-muted-foreground mb-12 max-w-md tracking-widest text-[10px] uppercase font-bold px-8 leading-loose">
          Estamos aguardando a confirmação do Mercado Pago. Isso pode levar alguns minutos (PIX) ou até 24h (Cartão).
          {orderId && <span className="block mt-4 text-white">PEDIDO #{orderId.slice(0, 8)}</span>}
        </p>

        <Card className="w-full max-w-md bg-white/[0.02] border-white/10 p-8 space-y-6 text-left mb-12">
            <div className="flex items-center gap-3 text-orange-400">
              <Info size={18} />
              <span className="font-display text-xs tracking-widest uppercase font-bold">O que acontece agora?</span>
            </div>
            <div className="h-[1px] w-full bg-white/5" />
            <p className="text-[9px] text-white/40 leading-relaxed uppercase tracking-widest font-bold">
               Nós monitoramos o status do seu pagamento em tempo real. Assim que for aprovado, seu pedido será processado automaticamente. Fique de olho no seu e-mail.
            </p>
        </Card>

        <div className="flex flex-col sm:flex-row gap-4">
          <Button asChild className="h-14 px-12 bg-white text-black hover:bg-primary font-display font-bold tracking-[0.3em]">
            <Link to="/perfil"><User size={16} className="mr-2" /> MEU PERFIL</Link>
          </Button>
          <Button asChild variant="outline" className="h-14 px-12 border-white/10 hover:bg-white/5 font-display font-bold tracking-[0.3em]">
            <Link to="/">VOLTAR À LOJA <ArrowRight size={16} className="ml-2" /></Link>
          </Button>
        </div>
      </main>
      <Footer />
    </div>
  );
}
