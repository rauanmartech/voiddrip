import { useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { XCircle, ArrowLeft, RefreshCw, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function Failure() {
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
          className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center text-red-500 mb-8 border border-red-500/20"
        >
          <XCircle size={48} />
        </motion.div>
        
        <h1 className="font-display text-4xl uppercase tracking-[0.2em] mb-4">PAGAMENTO NÃO CONCLUÍDO</h1>
        <p className="text-muted-foreground mb-12 max-w-md tracking-widest text-[10px] uppercase font-bold px-8">
          Algo aconteceu durante o processamento do seu pagamento. Verifique com seu banco ou tente outro método.
          {orderId && <span className="block mt-4 text-white">PEDIDO #{orderId.slice(0, 8)}</span>}
        </p>

        <div className="p-8 bg-red-500/5 border border-red-500/10 rounded-2xl flex items-center gap-6 mb-12 max-w-md text-left">
           <AlertTriangle size={32} className="text-red-500 flex-shrink-0" />
           <div className="space-y-1">
              <h5 className="font-display text-[10px] tracking-widest uppercase text-red-500">Atenção</h5>
              <p className="text-[9px] text-white/50 leading-relaxed uppercase tracking-widest ont-bold">
                 Nenhuma cobrança foi efetuada no seu cartão. Você pode tentar finalizar seu pedido no carrinho.
              </p>
           </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <Button asChild className="h-14 px-12 bg-white text-black hover:bg-primary font-display font-bold tracking-[0.3em]">
            <Link to="/checkout"><RefreshCw size={16} className="mr-2" /> TENTAR NOVAMENTE</Link>
          </Button>
          <Button asChild variant="outline" className="h-14 px-12 border-white/10 hover:bg-white/5 font-display font-bold tracking-[0.3em]">
            <Link to="/"><ArrowLeft size={16} className="mr-2" /> VOLTAR À LOJA</Link>
          </Button>
        </div>
      </main>
      <Footer />
    </div>
  );
}
