import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { CreditCard, ShieldCheck, Loader2, ChevronDown } from "lucide-react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

// Global types for MercadoPago
declare global {
  interface Window {
    MercadoPago: any;
  }
}

interface CardPaymentFormProps {
  orderId: string;
  amount: number;
  email: string;
  onSuccess: () => void;
  onCancel: () => void;
}

const STYLES = {
  input: "bg-white/[0.03] border-white/10 text-white placeholder:text-zinc-600 focus:border-primary/50 transition-all h-14 w-full rounded-xl",
  label: "text-[9px] tracking-[0.3em] text-zinc-500 uppercase mb-2 block font-black",
  container: "h-14 bg-white/[0.03] border border-white/10 rounded-xl px-4 flex items-center w-full focus-within:border-primary/50 transition-all"
};

export function CardPaymentForm({ orderId, amount, email, onSuccess, onCancel }: CardPaymentFormProps) {
  const mpRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [identificationTypes, setIdentificationTypes] = useState<any[]>([]);
  const [installments, setInstallments] = useState<any[]>([]);
  const [issuers, setIssuers] = useState<any[]>([]);
  const [paymentMethodId, setPaymentMethodId] = useState("");
  
  const [formData, setFormData] = useState({
    cardholderName: "",
    identificationType: "CPF",
    identificationNumber: "",
    issuer: "",
    installments: "1"
  });

  const fieldsRef = useRef<{
    cardNumber?: any;
    expirationDate?: any;
    securityCode?: any;
  }>({});

  useEffect(() => {
    const initMP = async () => {
      if (!window.MercadoPago) {
        const script = document.createElement("script");
        script.src = "https://sdk.mercadopago.com/js/v2";
        script.onload = () => setupFields();
        document.body.appendChild(script);
      } else {
        setupFields();
      }
    };

    const setupFields = () => {
      if (mpRef.current && fieldsRef.current.cardNumber) return;

      const mp = new window.MercadoPago(import.meta.env.VITE_MERCADO_PAGO_PUBLIC_KEY || "APP_USR-cae21cc5-66bd-4eb0-a6e6-682a39cc1e59", {
        locale: 'pt-BR'
      });
      mpRef.current = mp;

      const fields = mp.fields();
      
      fieldsRef.current.cardNumber = fields.create('cardNumber', {
        placeholder: "0000 0000 0000 0000",
        style: { color: "#ffffff", placeholder: { color: "#444444" } }
      }).mount('form-checkout__cardNumber');

      fieldsRef.current.expirationDate = fields.create('expirationDate', {
        placeholder: "MM/AA",
        style: { color: "#ffffff", placeholder: { color: "#444444" } }
      }).mount('form-checkout__expirationDate');

      fieldsRef.current.securityCode = fields.create('securityCode', {
        placeholder: "CVV",
        style: { color: "#ffffff", placeholder: { color: "#444444" } }
      }).mount('form-checkout__securityCode');

      fieldsRef.current.cardNumber.on('binChange', async (data: any) => {
        const { bin } = data;
        if (bin) {
          try {
            const { results } = await mp.getPaymentMethods({ bin });
            const method = results[0];
            setPaymentMethodId(method.id);
            fieldsRef.current.cardNumber.update({ settings: method.settings[0].card_number });
            fieldsRef.current.securityCode.update({ settings: method.settings[0].security_code });

            const issuersList = await mp.getIssuers({ paymentMethodId: method.id, bin });
            setIssuers(issuersList);
            if (issuersList.length > 0) setFormData(prev => ({ ...prev, issuer: issuersList[0].id }));

            const installmentsData = await mp.getInstallments({
              amount: String(amount),
              bin,
              paymentTypeId: 'credit_card'
            });
            setInstallments(installmentsData[0].payer_costs);
          } catch (e) {
            console.error(e);
          }
        }
      });

      mp.getIdentificationTypes().then((types: any) => setIdentificationTypes(types));
      setIsLoading(false);
    };

    initMP();
  }, [amount]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    const mp = mpRef.current;

    try {
      const tokenResult = await mp.fields.createCardToken({
        cardholderName: formData.cardholderName,
        identificationType: formData.identificationType,
        identificationNumber: formData.identificationNumber,
      });

      if (tokenResult.error) throw new Error(tokenResult.error.message || "Erro no cartão");

      const { data, error } = await supabase.functions.invoke('process-payment', {
        body: {
          orderId,
          paymentMethodId,
          token: tokenResult.id,
          installments: formData.installments,
          payerEmail: email,
          amount
        }
      });

      if (error) throw error;
      if (data.status === 'processed' || data.status === 'approved' || data.status === 'authorized') {
        toast.success("Pagamento aprovado!");
        onSuccess();
      } else {
        toast.error("Pagamento recusado.");
      }
    } catch (err: any) {
      toast.error(err.message || "Falha ao processar");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 pb-32 max-w-lg mx-auto w-full"
    >
      {/* Visual Card - Cyberpunk Street Style */}
      <div className="relative w-full aspect-[1.586/1] group perspective-1000">
        <div className="absolute inset-0 bg-neutral-900 rounded-[24px] shadow-2xl overflow-hidden border border-white/10 group-hover:border-primary/40 transition-all duration-700">
          <div className="absolute inset-0 opacity-[0.05] pointer-events-none mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
          
          <div className="p-6 md:p-8 h-full flex flex-col justify-between relative z-10">
            <div className="flex justify-between items-start">
              <div className="flex flex-col gap-1">
                <span className="text-[7px] md:text-[8px] uppercase tracking-[0.4em] font-black text-primary drop-shadow-[0_0_10px_rgba(139,255,0,0.6)]">VOID SECURE PAY</span>
                <div className="w-12 h-9 bg-gradient-to-br from-zinc-700 to-zinc-900 rounded-lg border border-white/5 shadow-inner flex items-center justify-center">
                   <div className="w-8 h-px bg-white/20" />
                </div>
              </div>
              {paymentMethodId ? (
                <div className="text-white font-black italic text-xl md:text-2xl uppercase tracking-tighter skew-x-[-15deg] drop-shadow-lg">{paymentMethodId}</div>
              ) : (
                <div className="w-14 h-7 bg-white/5 rounded-full animate-pulse" />
              )}
            </div>

            <div className="space-y-6">
              <div className="text-xl md:text-3xl font-mono tracking-[0.2em] text-white flex justify-between tabular-nums">
                <span>{paymentMethodId ? "****" : "••••"}</span>
                <span>****</span>
                <span>****</span>
                <span>****</span>
              </div>
              
              <div className="flex justify-between items-end">
                <div className="space-y-1">
                  <div className="text-[7px] text-zinc-500 uppercase tracking-widest font-bold">Holder Name</div>
                  <div className="text-[10px] md:text-xs uppercase tracking-[0.15em] font-black truncate max-w-[170px] text-white">
                    {formData.cardholderName || "VOID MEMBER"}
                  </div>
                </div>
                <div className="space-y-1 text-right">
                  <div className="text-[7px] text-zinc-500 uppercase tracking-widest font-bold">Expiry</div>
                  <div className="text-[10px] md:text-xs font-mono text-white">MM/AA</div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Street Accent */}
          <div className="absolute bottom-0 right-0 w-32 h-32 bg-primary/10 blur-[60px] rounded-full translate-x-1/2 translate-y-1/2" />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 bg-zinc-900/40 backdrop-blur-2xl p-6 md:p-10 rounded-[32px] border border-white/5 shadow-2xl relative overflow-hidden group">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-display text-[10px] uppercase tracking-[0.4em] text-white/50">Card Checkout</h3>
          <ShieldCheck className="text-primary/50" size={16} />
        </div>

        <div className="space-y-5">
          <div className="space-y-2">
            <label className={STYLES.label}>Card Number</label>
            <div id="form-checkout__cardNumber" className={STYLES.container}></div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className={STYLES.label}>Expiry Date</label>
              <div id="form-checkout__expirationDate" className={STYLES.container}></div>
            </div>
            <div className="space-y-2">
              <label className={STYLES.label}>Security Code</label>
              <div id="form-checkout__securityCode" className={STYLES.container}></div>
            </div>
          </div>

          <div className="space-y-2">
            <label className={STYLES.label}>Cardholder Name</label>
            <Input 
              placeholder="AS WRITTEN ON CARD"
              value={formData.cardholderName}
              onChange={e => setFormData(prev => ({ ...prev, cardholderName: e.target.value.toUpperCase() }))}
              className={`${STYLES.input} uppercase font-bold text-xs tracking-widest`}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className={STYLES.label}>ID Type</label>
              <div className="relative">
                <select 
                  value={formData.identificationType}
                  onChange={e => setFormData(prev => ({ ...prev, identificationType: e.target.value }))}
                  className={`${STYLES.input} appearance-none bg-zinc-900 border-white/5 px-4 text-xs font-bold`}
                >
                  {identificationTypes.map(type => (
                    <option key={type.id} value={type.id}>{type.name}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500" />
              </div>
            </div>
            <div className="space-y-2">
              <label className={STYLES.label}>ID Number</label>
              <Input 
                placeholder="NUMBERS ONLY"
                value={formData.identificationNumber}
                onChange={e => setFormData(prev => ({ ...prev, identificationNumber: e.target.value }))}
                className={STYLES.input}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className={STYLES.label}>Installments</label>
            <div className="relative">
              <select 
                value={formData.installments}
                onChange={e => setFormData(prev => ({ ...prev, installments: e.target.value }))}
                className={`${STYLES.input} appearance-none bg-zinc-900 border-white/5 px-4 text-xs font-bold ${installments.length === 0 ? 'text-zinc-600' : 'text-primary'}`}
                disabled={installments.length === 0}
              >
                {installments.length === 0 ? (
                  <option value="1">Enter card for options...</option>
                ) : (
                  installments.map(inst => (
                    <option key={inst.installments} value={inst.installments}>
                      {inst.recommended_message}
                    </option>
                  ))
                )}
              </select>
              <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-primary/50" />
            </div>
          </div>
        </div>

        <div className="pt-6 space-y-4">
          <Button 
            type="submit"
            disabled={isSubmitting || isLoading}
            className="w-full h-16 bg-white text-black font-black tracking-[0.3em] font-display hover:bg-primary transition-all duration-500 rounded-2xl text-[11px]"
          >
            {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : "EXECUTE PAYMENT"}
          </Button>
          
          <button type="button" onClick={onCancel} className="w-full text-[8px] text-zinc-600 uppercase tracking-[0.4em] font-black hover:text-white transition-colors">
            GO BACK TO SELECTION
          </button>
        </div>
        
        {/* Glow effect on hover */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      </form>
    </motion.div>
  );
}
