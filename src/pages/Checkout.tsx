import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { supabase } from "@/integrations/supabase/client";
import { 
  ChevronRight, 
  MapPin, 
  CreditCard, 
  ShieldCheck, 
  Truck, 
  Clock, 
  ArrowLeft, 
  CheckCircle2, 
  Check, 
  Loader2,
  Lock,
  Smartphone,
  User as UserIcon,
  Mail,
  ShoppingBag
} from "lucide-react";
import { AuthModal } from "@/components/AuthModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

// --- Types & Constants ---
type CheckoutStep = "identification" | "shipping" | "payment" | "success";

const PAYMENT_METHODS = [
  { id: "pix", label: "Pix (Aprovação Instantânea)", icon: "⚡" },
  { id: "card", label: "Cartão de Crédito (Até 12x)", icon: "💳" }
];

const STYLES = {
  input: "bg-white/5 border-white/10 text-white placeholder:text-muted-foreground focus:border-primary/50 transition-all h-12",
  label: "text-[10px] tracking-[0.2em] text-muted-foreground uppercase mb-1.5 block font-bold",
  stepContainer: "w-full max-w-2xl mx-auto space-y-8"
};

export default function Checkout() {
  const { user, signOut } = useAuth();
  const { items, cartTotal, removeFromCart, isInitialized } = useCart();
  const navigate = useNavigate();

  const [step, setStep] = useState<CheckoutStep>("identification");
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [errors, setErrors] = useState<string[]>([]);

  // Shake animation configuration
  const shakeAnimation = {
    shake: {
      x: [0, -10, 10, -10, 10, 0],
      transition: { duration: 0.4 }
    }
  };

  // Auto-scroll to top when step changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setErrors([]); // Clear errors on step change
  }, [step]);

  // Form States - Identification
  const [buyerData, setBuyerData] = useState({
    fullName: "",
    email: user?.email || "",
  });

  // Form States - Shipping
  const [address, setAddress] = useState({
    zipCode: "",
    street: "",
    number: "",
    complement: "",
    city: "",
    state: "",
    phone: ""
  });
  const [paymentMethod, setPaymentMethod] = useState("pix");

  // Sync email if user changes
  useEffect(() => {
    if (user?.email) {
      setBuyerData(prev => ({ ...prev, email: user.email }));
    }
  }, [user]);

  // --- Logic ---

  useEffect(() => {
    if (isInitialized && items.length === 0 && step !== "success") {
      navigate("/");
    }
  }, [items, step, navigate, isInitialized]);

  const handleZipCodeLookup = async (cep: string) => {
    const cleaned = cep.replace(/\D/g, "");
    if (cleaned.length === 8) {
      try {
        setIsLoading(true);
        const res = await fetch(`https://viacep.com.br/ws/${cleaned}/json/`);
        const data = await res.json();
        if (!data.erro) {
          setAddress(prev => ({
            ...prev,
            street: data.logradouro,
            city: data.localidade,
            state: data.uf
          }));
          toast.success("Endereço localizado!");
        } else {
          toast.error("CEP não encontrado.");
        }
      } catch (e) {
        toast.error("Erro ao buscar CEP.");
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleFinalizeOrder = async () => {
    if (items.length === 0) return;
    
    setIsLoading(true);
    try {
      // 1. Create Order
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          user_id: user?.id || null,
          total_amount: cartTotal,
          status: "pending",
          is_guest: !user,
          full_name: buyerData.fullName,
          email: buyerData.email
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // 2. Create Order Items
      const orderItems = items.map(item => ({
        order_id: order.id,
        product_id: item.product.id,
        quantity: item.quantity,
        price: item.product.price,
        size: item.size,
        color: item.color
      }));

      const { error: itemsError } = await supabase.from("order_items").insert(orderItems);
      if (itemsError) throw itemsError;

      // 3. Create Address
      const { error: addrError } = await supabase.from("addresses").insert({
        order_id: order.id,
        user_id: user?.id || null,
        street: address.street,
        number: address.number,
        complement: address.complement,
        zip_code: address.zipCode,
        city: address.city,
        state: address.state,
        phone: address.phone
      });
      if (addrError) throw addrError;

      // 4. Success Tasks
      setOrderId(order.id);
      setStep("success");
      
      // Clear Cart 
      items.forEach(item => removeFromCart(item.id));

    } catch (e: any) {
      toast.error(`Erro: ${e.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const deliveryDate = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() + 4);
    return date.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });
  }, []);

  const progress = {
    identification: 10,
    shipping: 50,
    payment: 90,
    success: 100
  }[step];

  if (!isInitialized && items.length === 0) {
    return (
      <div className="min-h-screen bg-[#030303] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#030303] text-white selection:bg-primary selection:text-black pb-20">
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 blur-[150px] rounded-full opacity-30" />
      </div>

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#030303]/80 backdrop-blur-xl border-b border-white/5">
        <div className="container mx-auto h-20 px-6 flex items-center justify-between">
          <button onClick={() => navigate("/")} className="font-display text-sm tracking-[0.3em] text-white">
            VOID <span className="opacity-50">DRIP</span>
          </button>
          
          <div className="hidden md:flex items-center gap-6">
            <div className="flex items-center gap-2 text-[9px] font-display tracking-[0.2em] font-bold">
              <span className={step === "identification" ? "text-primary" : "text-white/30"}>01 IDENTIFICAÇÃO</span>
              <ChevronRight size={10} className="text-white/20" />
              <span className={step === "shipping" ? "text-primary" : "text-white/30"}>02 ENTREGA</span>
              <ChevronRight size={10} className="text-white/20" />
              <span className={step === "payment" ? "text-primary" : "text-white/30"}>03 PAGAMENTO</span>
            </div>
          </div>

          <Lock size={16} className="text-primary" />
        </div>
        <div className="h-[1px] w-full bg-white/5 relative">
          <motion.div animate={{ width: `${progress}%` }} className="absolute top-0 left-0 h-full bg-primary" />
        </div>
      </header>

      <main className="container mx-auto px-6 pt-32 lg:pt-40 grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-12 xl:col-span-8">
          <AnimatePresence mode="wait">
            
            {step === "identification" && (
              <motion.div key="identification" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className={STYLES.stepContainer}>
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center text-primary">
                    <UserIcon size={20} />
                  </div>
                  <h2 className="font-display text-xl uppercase tracking-widest">Informações Pessoais</h2>
                </div>

                <div className="space-y-6">
                  <motion.div animate={errors.includes("fullName") ? "shake" : ""} variants={shakeAnimation}>
                    <label className={STYLES.label}>
                      Nome Completo {errors.includes("fullName") && <span className="text-red-500 ml-1">✕</span>}
                    </label>
                    <Input 
                      placeholder="Seu nome completo" 
                      value={buyerData.fullName} 
                      onChange={e => {
                        setBuyerData(prev => ({ ...prev, fullName: e.target.value }));
                        setErrors(prev => prev.filter(err => err !== "fullName"));
                      }}
                      className={`${STYLES.input} ${errors.includes("fullName") ? "border-red-500" : ""}`}
                    />
                  </motion.div>

                  <motion.div animate={errors.includes("email") ? "shake" : ""} variants={shakeAnimation}>
                    <label className={STYLES.label}>
                      E-mail {errors.includes("email") && <span className="text-red-500 ml-1">✕</span>}
                    </label>
                    <Input 
                      placeholder="seu@e-mail.com" 
                      value={buyerData.email} 
                      onChange={e => {
                        setBuyerData(prev => ({ ...prev, email: e.target.value }));
                        setErrors(prev => prev.filter(err => err !== "email"));
                      }}
                      disabled={!!user}
                      className={`${STYLES.input} ${errors.includes("email") ? "border-red-500" : ""}`}
                    />
                    {user && <span className="text-[10px] text-primary/60 mt-2 block tracking-widest uppercase font-bold">Logado via {user.app_metadata?.provider || 'Auth'}</span>}
                  </motion.div>

                  {!user && (
                    <Card className="p-6 bg-primary/5 border-primary/20 flex items-center justify-between mt-8">
                       <p className="text-[10px] text-white/70 tracking-widest uppercase">Já possui uma conta?</p>
                       <button onClick={() => setIsAuthModalOpen(true)} className="text-[10px] font-bold text-primary tracking-widest uppercase hover:underline">Fazer login agora</button>
                    </Card>
                  )}
                </div>

                <div className="flex justify-end pt-8">
                  <Button 
                    onClick={() => {
                      const newErrors: string[] = [];
                      if (!buyerData.fullName) newErrors.push("fullName");
                      if (!buyerData.email) newErrors.push("email");
                      
                      if (newErrors.length > 0) {
                        setErrors(newErrors);
                        toast.error("Por favor, preencha os campos marcados.");
                        return;
                      }
                      setStep("shipping");
                    }}
                    className="w-full md:w-auto px-12 h-14 bg-white text-black font-display tracking-[0.3em] font-bold hover:bg-primary transition-colors text-[11px]"
                  >
                    CONTINUAR PARA ENTREGA
                  </Button>
                </div>
              </motion.div>
            )}

            {step === "shipping" && (
              <motion.div key="shipping" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className={STYLES.stepContainer}>
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center text-primary">
                      <MapPin size={20} />
                    </div>
                    <h2 className="font-display text-xl uppercase tracking-widest">Endereço de Entrega</h2>
                  </div>
                  <button onClick={() => setStep("identification")} className="text-[9px] uppercase tracking-widest text-muted-foreground flex items-center gap-2 hover:text-white transition-colors">
                    <ArrowLeft size={10} /> Voltar
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
                  <motion.div className="md:col-span-2" animate={errors.includes("zipCode") ? "shake" : ""} variants={shakeAnimation}>
                    <label className={STYLES.label}>
                      CEP {errors.includes("zipCode") && <span className="text-red-500 ml-1">✕</span>}
                    </label>
                    <div className="relative">
                      <Input 
                        placeholder="00000-000" 
                        value={address.zipCode} 
                        onChange={(e) => {
                          const val = e.target.value.substring(0, 9);
                          setAddress(prev => ({ ...prev, zipCode: val }));
                          setErrors(prev => prev.filter(err => err !== "zipCode"));
                          handleZipCodeLookup(val);
                        }}
                        className={`${STYLES.input} ${errors.includes("zipCode") ? "border-red-500" : ""}`}
                      />
                      {isLoading && <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-primary" />}
                    </div>
                  </motion.div>
                  
                  <motion.div className="md:col-span-4" animate={errors.includes("street") ? "shake" : ""} variants={shakeAnimation}>
                    <label className={STYLES.label}>
                      Rua / Logradouro {errors.includes("street") && <span className="text-red-500 ml-1">✕</span>}
                    </label>
                    <Input 
                      placeholder="Nome da rua" 
                      value={address.street} 
                      onChange={e => {
                        setAddress(prev => ({ ...prev, street: e.target.value }));
                        setErrors(prev => prev.filter(err => err !== "street"));
                      }} 
                      className={`${STYLES.input} ${errors.includes("street") ? "border-red-500" : ""}`} 
                    />
                  </motion.div>

                  <motion.div className="md:col-span-2" animate={errors.includes("number") ? "shake" : ""} variants={shakeAnimation}>
                    <label className={STYLES.label}>
                      Número {errors.includes("number") && <span className="text-red-500 ml-1">✕</span>}
                    </label>
                    <Input 
                      placeholder="Ex: 123" 
                      value={address.number} 
                      onChange={e => {
                        setAddress(prev => ({ ...prev, number: e.target.value }));
                        setErrors(prev => prev.filter(err => err !== "number"));
                      }} 
                      className={`${STYLES.input} ${errors.includes("number") ? "border-red-500" : ""}`} 
                    />
                  </motion.div>

                  <div className="md:col-span-4">
                    <label className={STYLES.label}>Complemento</label>
                    <Input placeholder="Apto, bloco, etc (Opcional)" value={address.complement} onChange={e => setAddress(prev => ({ ...prev, complement: e.target.value }))} className={STYLES.input} />
                  </div>

                  <div className="md:col-span-3">
                    <label className={STYLES.label}>Cidade</label>
                    <Input placeholder="Sua cidade" value={address.city} onChange={e => setAddress(prev => ({ ...prev, city: e.target.value }))} className={STYLES.input} />
                  </div>

                  <div className="md:col-span-3">
                    <label className={STYLES.label}>Estado</label>
                    <Input placeholder="UF" value={address.state} onChange={e => setAddress(prev => ({ ...prev, state: e.target.value }))} className={STYLES.input} />
                  </div>

                  <motion.div className="md:col-span-6 border-t border-white/5 pt-6 mt-4" animate={errors.includes("phone") ? "shake" : ""} variants={shakeAnimation}>
                    <div className="flex items-center gap-3 mb-6">
                       <Smartphone size={16} className="text-primary" />
                       <div className="flex flex-col">
                          <label className={`text-[10px] tracking-widest uppercase font-bold ${errors.includes("phone") ? "text-red-500" : "text-white"}`}>
                            Telefone para Entrega {errors.includes("phone") && <span className="ml-1">✕</span>}
                          </label>
                          <span className="text-[9px] text-muted-foreground">Será usado exclusivamente para avisos de entrega via WhatsApp.</span>
                       </div>
                    </div>
                    <Input 
                      placeholder="(00) 00000-0000" 
                      value={address.phone} 
                      onChange={e => {
                        setAddress(prev => ({ ...prev, phone: e.target.value }));
                        setErrors(prev => prev.filter(err => err !== "phone"));
                      }} 
                      className={`${STYLES.input} ${errors.includes("phone") ? "border-red-500" : ""}`} 
                    />
                  </motion.div>
                </div>

                <div className="flex flex-col md:flex-row gap-4 pt-8">
                  <Button 
                    variant="outline"
                    onClick={() => setStep("identification")}
                    className="w-full md:w-auto px-8 h-14 border-white/10 text-white hover:bg-white/5 tracking-[0.2em] font-display text-[10px]"
                  >
                    VOLTAR
                  </Button>
                  <Button 
                    onClick={() => {
                      const newErrors: string[] = [];
                      if (!address.zipCode) newErrors.push("zipCode");
                      if (!address.street) newErrors.push("street");
                      if (!address.number) newErrors.push("number");
                      if (!address.phone) newErrors.push("phone");

                      if (newErrors.length > 0) {
                        setErrors(newErrors);
                        toast.error("Por favor, preencha os campos marcados.");
                        return;
                      }
                      setStep("payment");
                    }}
                    className="flex-1 h-14 bg-white text-black font-display tracking-[0.3em] font-bold hover:bg-primary transition-colors text-[11px]"
                  >
                    CONTINUAR PARA PAGAMENTO
                  </Button>
                </div>
              </motion.div>
            )}

            {step === "payment" && (
              <motion.div key="payment" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className={STYLES.stepContainer}>
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center text-primary">
                    <CreditCard size={20} />
                  </div>
                  <h2 className="font-display text-xl uppercase tracking-widest">Forma de Pagamento</h2>
                </div>

                <div className="space-y-4 mb-8">
                   {PAYMENT_METHODS.map(method => (
                     <button
                        key={method.id}
                        onClick={() => setPaymentMethod(method.id)}
                        className={`w-full p-6 flex items-center justify-between border transition-all ${
                          paymentMethod === method.id 
                          ? "bg-white/10 border-primary" 
                          : "bg-white/[0.02] border-white/5 hover:border-white/20"
                        }`}
                     >
                        <div className="flex items-center gap-4">
                           <span className="text-2xl">{method.icon}</span>
                           <h4 className="font-display text-xs tracking-widest uppercase text-left">{method.label}</h4>
                        </div>
                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                          paymentMethod === method.id ? "bg-primary border-primary" : "border-white/20"
                        }`}>
                           {paymentMethod === method.id && <Check size={12} className="text-black" />}
                        </div>
                     </button>
                   ))}
                </div>

                <div className="p-8 bg-primary/5 border border-primary/20 rounded-2xl flex items-start gap-4 mb-8">
                    <ShieldCheck size={24} className="text-primary flex-shrink-0" />
                    <div className="space-y-1">
                       <h5 className="font-display text-[11px] tracking-widest uppercase text-primary">Segurança Absoluta</h5>
                       <p className="text-[10px] text-white/50 leading-relaxed">
                          Nós utilizamos criptografia SSL para garantir que todos os seus dados permaneçam privados.
                       </p>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row gap-4">
                  <Button 
                    variant="outline"
                    onClick={() => setStep("shipping")}
                    className="w-full md:w-auto px-8 h-16 border-white/10 text-white hover:bg-white/5 tracking-[0.2em] font-display text-[10px]"
                  >
                    VOLTAR
                  </Button>
                  <button 
                    onClick={handleFinalizeOrder}
                    disabled={isLoading}
                    className="flex-1 btn-neon-green py-6 flex items-center justify-center gap-3 transition-all font-bold text-[12px] tracking-[0.4em]"
                  >
                    {isLoading ? <Loader2 className="animate-spin" /> : `FECHAR PEDIDO DE ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cartTotal)}`}
                  </button>
                </div>
              </motion.div>
            )}

            {step === "success" && (
              <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center text-center max-w-xl mx-auto py-12">
                <div className="w-24 h-24 bg-primary/20 rounded-full flex items-center justify-center text-primary mb-8 animate-in zoom-in duration-500">
                    <CheckCircle2 size={48} />
                </div>
                <h1 className="font-display text-3xl uppercase tracking-[0.2em] mb-4">PEDIDO REALIZADO</h1>
                <p className="text-muted-foreground mb-12">Sua vaga no VOID está garantida. Pedido <span className="text-white font-bold">#{orderId?.slice(0, 8)}</span>.</p>
                
                <Card className="w-full bg-white/[0.02] border-white/10 p-8 space-y-6 text-left mb-12">
                   <div className="flex items-center gap-3 text-primary">
                      <Truck size={18} />
                      <span className="font-display text-xs tracking-widest uppercase font-bold">Previsão: {deliveryDate}</span>
                   </div>
                   <p className="text-[10px] text-white/40 leading-relaxed italic">
                      "Você tem garantia incondicional de 7 dias após o recebimento conforme o CDC."
                   </p>
                </Card>

                <Button onClick={() => navigate("/")} className="px-12 h-14 border border-white/20 bg-transparent text-white hover:bg-white hover:text-black tracking-[0.3em]">
                   VOLTAR À LOJA
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Floating Sidebar Summary */}
        {step !== "success" && (
          <aside className="lg:col-span-12 xl:col-span-4 h-fit sticky top-20 xl:top-40">
             <div className="bg-[#050505] border border-white/5 p-8 rounded-2xl shadow-2xl relative overflow-hidden">
                <div className="flex items-center gap-2 mb-8">
                   <ShoppingBag size={16} className="text-white/50" />
                   <h3 className="font-display text-[10px] tracking-[0.3em] uppercase">Resumo</h3>
                </div>

                <div className="space-y-4 mb-8 max-h-[300px] overflow-y-auto no-scrollbar pr-2">
                   {items.map(item => (
                     <div key={item.id} className="flex gap-4 items-center">
                        <div className="w-12 h-14 bg-black border border-white/10 rounded overflow-hidden flex-shrink-0">
                           <img src={item.product.image_url?.split(',')[0]} className="w-full h-full object-cover opacity-60" />
                        </div>
                        <div className="flex-1 min-w-0">
                           <h5 className="font-display text-[9px] tracking-widest uppercase truncate">{item.product.name}</h5>
                           <p className="text-[9px] text-muted-foreground uppercase">{item.size} | {item.quantity}un</p>
                        </div>
                        <span className="font-display text-[10px] tracking-widest">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.product.price * item.quantity)}
                        </span>
                     </div>
                   ))}
                </div>

                <div className="space-y-3 pt-6 border-t border-white/5">
                   <div className="flex justify-between text-[10px] tracking-widest text-muted-foreground uppercase">
                      <span>Subtotal</span>
                      <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cartTotal)}</span>
                   </div>
                   <div className="flex justify-between text-[10px] tracking-widest text-primary uppercase font-bold">
                      <span>Frete</span>
                      <span>GRÁTIS</span>
                   </div>
                   <div className="flex justify-between items-end pt-4">
                      <span className="font-display text-sm tracking-widest">TOTAL</span>
                      <span className="font-display text-2xl tracking-wider text-white">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cartTotal)}
                      </span>
                   </div>
                </div>
             </div>

             <div className="mt-8 p-6 bg-gradient-to-r from-orange-500/10 to-transparent border border-orange-500/20 rounded-2xl flex items-center gap-4">
               <div className="w-10 h-10 bg-orange-500/10 rounded-full flex items-center justify-center text-orange-400">
                  <Clock size={18} />
               </div>
               <div>
                  <p className="text-[10px] font-bold text-white uppercase tracking-widest">Última Chamada</p>
                  <p className="text-[9px] text-orange-200/60 leading-none mt-1 uppercase">Envio hoje se finalizar em 42 min</p>
               </div>
             </div>
          </aside>
        )}
      </main>

      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
        onSuccess={() => setIsAuthModalOpen(false)} 
      />
    </div>
  );
}
