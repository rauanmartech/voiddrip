import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { QrCode, Copy, CheckCircle2, Loader2, ArrowLeft, ShieldCheck, Clock } from "lucide-react";
import { Button } from "./ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface PixPaymentProps {
  orderId: string;
  amount: number;
  email: string;
  identification: { type: string; number: string };
  onSuccess: () => void;
  onCancel: () => void;
}

export function PixPayment({ orderId, amount, email, identification, onSuccess, onCancel }: PixPaymentProps) {
  const [pixData, setPixData] = useState<{ qrCode: string; qrCodeBase64: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCopied, setIsCopied] = useState(false);
  const [status, setStatus] = useState<"pending" | "paid" | "expired">("pending");

  useEffect(() => {
    const generatePix = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('process-payment', {
          body: {
            orderId,
            paymentMethodId: 'pix',
            payerEmail: email,
            amount,
            identification
          }
        });

        if (error) throw error;

        // The Edge Function now returns /v1/payments response for Pix.
        // QR code lives at: data.point_of_interaction.transaction_data
        const poi = data?.point_of_interaction?.transaction_data;
        const qrCode = poi?.qr_code;
        const qrCodeBase64 = poi?.qr_code_base64;

        if (!qrCode) {
          console.error('PIX response structure:', JSON.stringify(data, null, 2));
          throw new Error('QR Code não encontrado na resposta do Mercado Pago.');
        }

        setPixData({
          qrCode,
          qrCodeBase64
        });
      } catch (err: any) {
        toast.error("Erro ao gerar Pix: " + (err.message || "Tente novamente"));
      } finally {
        setIsLoading(false);
      }
    };

    generatePix();
  }, [orderId, amount, email]);

  // Polling for payment status
  useEffect(() => {
    if (!pixData || status === "paid") return;

    const interval = setInterval(async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("status")
        .eq("id", orderId)
        .single();

      if (data?.status === "paid" || data?.status === "approved") {
        setStatus("paid");
        clearInterval(interval);
        setTimeout(onSuccess, 2000);
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [pixData, orderId, status, onSuccess]);

  const handleCopy = () => {
    if (!pixData) return;
    navigator.clipboard.writeText(pixData.qrCode);
    setIsCopied(true);
    toast.success("Código Pix copiado!");
    setTimeout(() => setIsCopied(false), 3000);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <Loader2 className="animate-spin text-primary" size={32} />
        <p className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground">Gerando QR Code Pix...</p>
      </div>
    );
  }

  if (status === "paid") {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center py-20 text-center space-y-4"
      >
        <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center text-primary mb-2">
          <CheckCircle2 size={32} />
        </div>
        <h3 className="text-xl font-display uppercase tracking-widest text-primary">PAGAMENTO CONFIRMADO</h3>
        <p className="text-xs text-muted-foreground uppercase tracking-widest">Sua transação foi processada com sucesso.</p>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div className="text-center space-y-2">
        <h3 className="text-2xl font-display uppercase tracking-widest text-white">RESERVE SEU DROP</h3>
        <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Digitalize o código abaixo para pagar instantaneamente</p>
      </div>

      {/* QR Code Frame */}
      <div className="relative group max-w-[280px] mx-auto">
        <div className="absolute -inset-1 bg-gradient-to-r from-primary/50 to-primary blur opacity-25 group-hover:opacity-100 transition duration-1000"></div>
        <div className="relative bg-[#050505] p-6 rounded-2xl border border-white/10 flex flex-col items-center">
          {pixData && (
            <img 
              src={`data:image/png;base64,${pixData.qrCodeBase64}`} 
              alt="Pix QR Code"
              className="w-full aspect-square rounded-lg filter invert brightness-150" 
            />
          )}
          
          <div className="mt-4 flex items-center gap-2 text-primary font-mono text-sm">
            <Clock size={14} className="animate-pulse" />
            <span className="tracking-tighter">AGUARDANDO PAGAMENTO</span>
          </div>
        </div>
      </div>

      <div className="space-y-4 max-w-sm mx-auto">
        <div className="space-y-2">
          <p className="text-[9px] text-white/30 uppercase tracking-[0.2em] font-bold text-center">Pix Copia e Cola</p>
          <div className="relative group">
            <input 
              readOnly 
              value={pixData?.qrCode} 
              className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-[10px] text-white/50 font-mono pr-12 focus:outline-none"
            />
            <button 
              onClick={handleCopy}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 hover:text-primary transition-colors"
            >
              {isCopied ? <CheckCircle2 size={16} className="text-primary" /> : <Copy size={16} />}
            </button>
          </div>
        </div>

        <Button 
          onClick={handleCopy}
          className="w-full h-14 bg-white text-black font-display tracking-[0.2em] font-bold hover:bg-primary transition-all text-[11px]"
        >
          {isCopied ? "COPIADO!" : "COPIAR CÓDIGO PIX"}
        </Button>

        <button 
          onClick={onCancel}
          className="w-full flex items-center justify-center gap-2 text-[10px] text-muted-foreground uppercase tracking-widest font-bold hover:text-white transition-colors py-2"
        >
          <ArrowLeft size={12} /> Voltar para opções
        </button>
      </div>

      {/* Instructions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-lg mx-auto pt-6 border-t border-white/5">
        <div className="flex gap-4">
          <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/50 shrink-0 font-bold text-xs">1</div>
          <p className="text-[9px] text-muted-foreground uppercase leading-relaxed tracking-tighter">Abra o app do seu banco e escolha a opção <b>Pix</b>.</p>
        </div>
        <div className="flex gap-4">
          <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/50 shrink-0 font-bold text-xs">2</div>
          <p className="text-[9px] text-muted-foreground uppercase leading-relaxed tracking-tighter">Escaneie o <b>QR Code</b> ou cole o código acima.</p>
        </div>
      </div>

      <div className="flex items-center justify-center gap-2 pt-4 opacity-50">
        <ShieldCheck size={14} className="text-primary" />
        <span className="text-[9px] uppercase tracking-tighter">Pagamento Instantâneo via Mercado Pago</span>
      </div>
    </motion.div>
  );
}
