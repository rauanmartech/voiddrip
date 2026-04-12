import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CreditCard, ShieldCheck, Info, Loader2, ChevronDown } from "lucide-react";
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
  input: "bg-white/5 border-white/10 text-white placeholder:text-muted-foreground focus:border-primary/50 transition-all h-12 w-full",
  label: "text-[10px] tracking-[0.2em] text-muted-foreground uppercase mb-1.5 block font-bold",
  container: "h-12 bg-white/5 border border-white/10 rounded-md px-3 flex items-center w-full focus-within:border-primary/50 transition-all"
};

export function CardPaymentForm({ orderId, amount, email, onSuccess, onCancel }: CardPaymentFormProps) {
  const mpRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // States for dynamic data
  const [identificationTypes, setIdentificationTypes] = useState<any[]>([]);
  const [installments, setInstallments] = useState<any[]>([]);
  const [issuers, setIssuers] = useState<any[]>([]);
  const [paymentMethodId, setPaymentMethodId] = useState("");
  
  // Form fields
  const [formData, setFormData] = useState({
    cardholderName: "",
    identificationType: "CPF",
    identificationNumber: "",
    issuer: "",
    installments: "1"
  });

  // Secure field instances
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

      // Create secure fields
      const fields = mp.fields();
      
      fieldsRef.current.cardNumber = fields.create('cardNumber', {
        placeholder: "0000 0000 0000 0000",
        style: {
          color: "#ffffff",
          placeholder: { color: "#555555" }
        }
      }).mount('form-checkout__cardNumber');

      fieldsRef.current.expirationDate = fields.create('expirationDate', {
        placeholder: "MM/AA",
        style: {
          color: "#ffffff",
          placeholder: { color: "#555555" }
        }
      }).mount('form-checkout__expirationDate');

      fieldsRef.current.securityCode = fields.create('securityCode', {
        placeholder: "CVV",
        style: {
          color: "#ffffff",
          placeholder: { color: "#555555" }
        }
      }).mount('form-checkout__securityCode');

      // BIN Change listener
      fieldsRef.current.cardNumber.on('binChange', async (data: any) => {
        const { bin } = data;
        if (bin) {
          try {
            const { results } = await mp.getPaymentMethods({ bin });
            const method = results[0];
            setPaymentMethodId(method.id);
            
            // Update fields settings (validations)
            fieldsRef.current.cardNumber.update({ settings: method.settings[0].card_number });
            fieldsRef.current.securityCode.update({ settings: method.settings[0].security_code });

            // Fetch Issuers
            const issuersList = await mp.getIssuers({ paymentMethodId: method.id, bin });
            setIssuers(issuersList);
            if (issuersList.length > 0) setFormData(prev => ({ ...prev, issuer: issuersList[0].id }));

            // Fetch Installments
            const installmentsData = await mp.getInstallments({
              amount: String(amount),
              bin,
              paymentTypeId: 'credit_card'
            });
            setInstallments(installmentsData[0].payer_costs);
          } catch (e) {
            console.error("Error on bin change:", e);
          }
        }
      });

      // Identification Types
      mp.getIdentificationTypes().then((types: any) => {
        setIdentificationTypes(types);
      });

      setIsLoading(false);
    };

    initMP();

    return () => {
      // Cleanup? MercadoPago V2 fields don't have a direct unmount but we should be careful
    };
  }, [amount]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    const mp = mpRef.current;

    try {
      // Create Token
      const tokenResult = await mp.fields.createCardToken({
        cardholderName: formData.cardholderName,
        identificationType: formData.identificationType,
        identificationNumber: formData.identificationNumber,
      });

      if (tokenResult.error) {
        throw new Error(tokenResult.error.message || "Erro ao validar cartão");
      }

      const token = tokenResult.id;

      // Process Payment via Edge Function
      const { data, error } = await supabase.functions.invoke('process-payment', {
        body: {
          orderId,
          paymentMethodId,
          token,
          installments: formData.installments,
          payerEmail: email,
          amount
        }
      });

      if (error) throw error;

      if (data.status === 'processed' || data.status === 'approved' || data.status === 'action_required') {
        toast.success("Pagamento processado!");
        onSuccess();
      } else {
        toast.error("O pagamento foi recusado. Tente outro cartão.");
      }

    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Falha ao processar pagamento");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-12 mt-12 md:mt-20 pb-32"
    >
      <div className="flex items-center justify-between mb-10">
        <div className="flex items-center gap-3">
          <CreditCard className="text-primary" size={20} />
          <h3 className="font-display text-base md:text-lg uppercase tracking-[0.3em]">Cartão de Crédito</h3>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1 bg-primary/10 border border-primary/20 rounded text-[9px] text-primary font-bold uppercase tracking-tighter">
          <ShieldCheck size={10} /> PCI Certified
        </div>
      </div>

      {/* Visual Card Preview */}
      <div className="relative w-full aspect-[1.586/1] max-w-sm mx-auto group">
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-800 to-black rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2" />
          
          <div className="p-8 h-full flex flex-col justify-between relative z-10">
            <div className="flex justify-between items-start">
              <div className="w-12 h-10 bg-gradient-to-br from-amber-200/20 to-amber-500/20 rounded-lg border border-amber-500/20 shadow-inner" />
              {paymentMethodId ? (
                <div className="text-white font-bold italic text-lg uppercase tracking-tighter">{paymentMethodId}</div>
              ) : (
                <div className="w-12 h-8 bg-white/5 rounded animate-pulse" />
              )}
            </div>

            <div className="space-y-6">
              <div className="text-xl md:text-2xl font-mono tracking-[0.2em] text-white/90">
                {paymentMethodId ? "**** **** **** ****" : "•••• •••• •••• ••••"}
              </div>
              
              <div className="flex justify-between items-end">
                <div className="space-y-1">
                  <div className="text-[7px] text-white/30 uppercase tracking-widest font-bold">Card Holder</div>
                  <div className="text-xs uppercase tracking-widest font-bold truncate max-w-[180px]">
                    {formData.cardholderName || "NOME DO TITULAR"}
                  </div>
                </div>
                <div className="space-y-1 text-right">
                  <div className="text-[7px] text-white/30 uppercase tracking-widest font-bold">Expires</div>
                  <div className="text-xs font-mono">MM/AA</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Card Number Container */}
        <div className="space-y-1.5">
          <label className={STYLES.label}>Número do Cartão</label>
          <div id="form-checkout__cardNumber" className={STYLES.container}></div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className={STYLES.label}>Data de Validade</label>
            <div id="form-checkout__expirationDate" className={STYLES.container}></div>
          </div>
          <div className="space-y-1.5">
            <label className={STYLES.label}>Código CVV</label>
            <div id="form-checkout__securityCode" className={STYLES.container}></div>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className={STYLES.label}>Nome do Titular</label>
          <Input 
            placeholder="Como está gravado no cartão"
            value={formData.cardholderName}
            onChange={e => setFormData(prev => ({ ...prev, cardholderName: e.target.value }))}
            className={STYLES.input}
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className={STYLES.label}>Tipo de Documento</label>
            <div className="relative">
              <select 
                value={formData.identificationType}
                onChange={e => setFormData(prev => ({ ...prev, identificationType: e.target.value }))}
                className={`${STYLES.input} appearance-none px-3`}
              >
                {identificationTypes.map(type => (
                  <option key={type.id} value={type.id} className="bg-[#0a0a0a]">{type.name}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground" />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className={STYLES.label}>Número do Documento</label>
            <Input 
              placeholder="Apenas números"
              value={formData.identificationNumber}
              onChange={e => setFormData(prev => ({ ...prev, identificationNumber: e.target.value }))}
              className={STYLES.input}
              required
            />
          </div>
        </div>

        {issuers.length > 1 && (
          <div className="space-y-1.5">
            <label className={STYLES.label}>Banco Emissor</label>
            <div className="relative">
              <select 
                value={formData.issuer}
                onChange={e => setFormData(prev => ({ ...prev, issuer: e.target.value }))}
                className={`${STYLES.input} appearance-none px-3`}
              >
                {issuers.map(issuer => (
                  <option key={issuer.id} value={issuer.id} className="bg-[#0a0a0a]">{issuer.name}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground" />
            </div>
          </div>
        )}

        <div className="space-y-1.5">
          <label className={STYLES.label}>Parcelamento</label>
          <div className="relative">
            <select 
              value={formData.installments}
              onChange={e => setFormData(prev => ({ ...prev, installments: e.target.value }))}
              className={`${STYLES.input} appearance-none px-3`}
              disabled={installments.length === 0}
            >
              {installments.length === 0 ? (
                <option value="1">Digite o cartão para ver parcelas</option>
              ) : (
                installments.map(inst => (
                  <option key={inst.installments} value={inst.installments} className="bg-[#0a0a0a]">
                    {inst.recommended_message}
                  </option>
                ))
              )}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground" />
          </div>
        </div>

        <div className="pt-4 space-y-4">
          <Button 
            type="submit"
            disabled={isSubmitting || isLoading}
            className="w-full h-14 bg-primary text-black font-display tracking-[0.2em] font-bold hover:bg-primary/90 transition-all text-[11px] group"
          >
            {isSubmitting ? (
              <Loader2 className="animate-spin mr-2" size={18} />
            ) : (
              <>CONFIRMAR PAGAMENTO DE {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amount)}</>
            )}
          </Button>
          
          <button 
            type="button"
            onClick={onCancel}
            className="w-full text-[10px] text-muted-foreground uppercase tracking-widest font-bold hover:text-white transition-colors"
          >
            Voltar para opções
          </button>
        </div>

        <div className="flex items-center justify-center gap-2 pt-4 opacity-50">
          <ShieldCheck size={14} className="text-secondary" />
          <span className="text-[9px] uppercase tracking-tighter">Ambiente Seguro & PCI Compliant</span>
        </div>
      </form>
    </motion.div>
  );
}
