import { useEffect, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { XCircle, ArrowLeft, RefreshCw, AlertTriangle, CreditCard, Smartphone, MessageCircle, ChevronRight, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function Failure() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("external_reference") || searchParams.get("orderId") || searchParams.get("preference_id");
  const status = searchParams.get("status");

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const errorMessage = useMemo(() => {
    switch (status) {
      case "cc_rejected_insufficient_amount":
        return "Cartão sem limite disponível. Tente outro cartão ou use Pix.";
      case "cc_rejected_bad_filled_security_code":
        return "Dígito verificador incorreto. Verifique os dados e tente novamente.";
      case "cc_rejected_call_for_authorize":
        return "Pagamento não autorizado pelo banco. Entre em contato com o emissor.";
      default:
        return "Sinal interrompido. Algo impediu o processamento do seu pagamento.";
    }
  }, [status]);

  return (
    <div className="min-h-screen bg-[#030303] text-white flex flex-col">
      <Navbar />
      
      <main className="flex-grow container mx-auto px-6 py-24">
        {/* Failure Header */}
        <div className="flex flex-col items-center text-center space-y-6 mb-16">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative"
          >
            <div className="absolute inset-0 bg-red-500/10 blur-3xl rounded-full" />
            <div className="relative w-20 h-20 bg-white/5 border border-red-500/20 rounded-2xl flex items-center justify-center text-red-500 backdrop-blur-xl">
              <XCircle size={40} />
            </div>
          </motion.div>
          
          <div className="space-y-2">
            <h1 className="font-display text-2xl md:text-3xl uppercase tracking-[0.3em] font-bold text-red-500">SINAL INTERROMPIDO</h1>
            <p className="text-muted-foreground max-w-sm mx-auto tracking-[0.15em] text-[10px] md:text-xs uppercase font-medium leading-relaxed">
              Sua reserva expira em breve. Não perca este drop por um erro de conexão.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 max-w-4xl mx-auto">
          {/* Recovery Main Card */}
          <Card className="md:col-span-12 bg-white/[0.02] border-white/10 p-8 relative overflow-hidden group">
            <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-red-500/5 blur-[80px] rounded-full pointer-events-none" />
            
            <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
              <div className="space-y-4 max-w-md text-center md:text-left">
                <div className="flex items-center gap-2 text-red-400">
                  <AlertTriangle size={16} />
                  <span className="text-[10px] uppercase tracking-widest font-bold">Diagnóstico do Erro</span>
                </div>
                <p className="text-sm text-white font-medium uppercase tracking-tight leading-relaxed">
                  {errorMessage}
                </p>
                <div className="pt-2">
                  <p className="text-[9px] text-muted-foreground uppercase tracking-widest leading-loose">
                    Seu pedido ainda está reservado, mas por tempo limitado. 
                    Recomendamos o **Pix** para aprovação instantânea e garantia do seu item.
                  </p>
                </div>
              </div>

              <div className="w-full md:w-64 space-y-3">
                <Button asChild className="w-full h-14 bg-white text-black hover:bg-primary font-display font-bold tracking-[0.3em] text-[11px]">
                  <Link to="/checkout"><RefreshCw size={14} className="mr-2" /> TENTAR NOVAMENTE</Link>
                </Button>
                <Button asChild variant="outline" className="w-full h-12 border-primary/20 bg-primary/5 text-primary hover:bg-primary/10 font-display font-bold tracking-[0.2em] text-[9px] uppercase">
                  <Link to="/checkout"><Smartphone size={14} className="mr-2" /> PAGAR COM PIX</Link>
                </Button>
              </div>
            </div>
          </Card>

          {/* Help & Support Grid */}
          <Card className="md:col-span-6 bg-white/[0.01] border-white/10 p-6 flex flex-col justify-between group hover:border-white/20 transition-colors">
            <div className="space-y-4">
              <MessageCircle size={20} className="text-primary opacity-50 group-hover:opacity-100 transition-opacity" />
              <h4 className="text-[10px] font-bold uppercase tracking-[0.2em]">Falar com um Especialista</h4>
              <p className="text-[9px] text-muted-foreground leading-relaxed uppercase tracking-tighter">
                Nossa equipe pode te ajudar a finalizar o pedido manualmente via WhatsApp.
              </p>
            </div>
            <a href="https://wa.me/5511999999999" target="_blank" rel="noopener noreferrer" className="mt-6 flex items-center justify-between group/link">
              <span className="text-[9px] font-bold uppercase tracking-widest text-primary">Abrir Suporte</span>
              <ChevronRight size={14} className="text-primary group-hover/link:translate-x-1 transition-transform" />
            </a>
          </Card>

          <Card className="md:col-span-6 bg-white/[0.01] border-white/10 p-6 flex flex-col justify-between group hover:border-white/20 transition-colors">
            <div className="space-y-4">
              <Info size={20} className="text-muted-foreground opacity-50 group-hover:opacity-100 transition-opacity" />
              <h4 className="text-[10px] font-bold uppercase tracking-[0.2em]">Métodos Alternativos</h4>
              <p className="text-[9px] text-muted-foreground leading-relaxed uppercase tracking-tighter">
                Aceitamos cartões de bandeiras internacionais e Pix direto. 
                Evite bloqueios conferindo o limite antes.
              </p>
            </div>
            <Link to="/" className="mt-6 flex items-center justify-between group/link">
              <span className="text-[9px] font-bold uppercase tracking-widest">Voltar para Loja</span>
              <ChevronRight size={14} className="group-hover/link:translate-x-1 transition-transform" />
            </Link>
          </Card>
        </div>

        <div className="flex justify-center mt-12 pb-12">
           <p className="text-[9px] text-white/20 uppercase tracking-[0.4em]">Voiddrip Identification Protocol v2.0</p>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
