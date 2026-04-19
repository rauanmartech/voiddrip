import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { supabase } from "@/integrations/supabase/client";
import { ChevronRight, Lock, MapPin, Truck, Check, Package, ShoppingBag, ArrowLeft, Loader2, CheckCircle2, User as UserIcon, ShieldCheck, Mail, Smartphone, Star, CreditCard, Clock, Banknote, DollarSign, Ticket } from "lucide-react";
import voidLogo from "../assets/voiddrip.jpeg";
import { AuthModal } from "@/components/AuthModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { CardPaymentForm } from "@/components/CardPaymentForm";
import { PixPayment } from "@/components/PixPayment";

// --- Types & Constants ---
type CheckoutStep = "identification" | "shipping" | "payment" | "success";

const PAYMENT_METHODS = [
  { id: "pix", label: "Pix (Aprovação Instantânea)", icon: "?" },
  { id: "card", label: "Cartão de Crédito (Até 12x)", icon: "??" }
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
  const [mpPreferenceId, setMpPreferenceId] = useState<string | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [paymentStep, setPaymentStep] = useState<"choice" | "card" | "pix">("choice");

  // Coupon state
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [couponError, setCouponError] = useState("");
  const [validatingCoupon, setValidatingCoupon] = useState(false);

  // Lock body scroll when payment modal is open to prevent coordinate mismatch on iframes
  useEffect(() => {
    if (paymentStep === "card" || paymentStep === "pix") {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [paymentStep]);

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
    documentNumber: "",
  });

  // Form States - Shipping
  const [address, setAddress] = useState({
    zipCode: "",
    street: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: "",
    phone: "",
    fullName: "",
  });
  const [paymentMethod, setPaymentMethod] = useState("pix");

  // Synchronize email if user changes
  useEffect(() => {
    if (user?.email) {
      setBuyerData(prev => ({ ...prev, email: user.email }));
    }
  }, [user]);



  // PIX POLLING: Monitor order status in real-time ONLY when the user is on the PIX screen
  // This must NOT run on the "choice" screen or during card payment to avoid false positives.
  useEffect(() => {
    let interval: number;

    if (step === "payment" && paymentStep === "pix" && orderId) {
      // Check every 4 seconds if the order was approved via MP webhook
      interval = window.setInterval(async () => {
        const { data } = await supabase
          .from("orders")
          .select("status")
          .eq("id", orderId)
          .single();

        if (data && (data.status === "paid" || data.status === "approved")) {
          clearInterval(interval);
          setStep("success");
          toast.success("Pagamento confirmado via Pix!");
        }
      }, 4000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [step, paymentStep, orderId]);

  // --- Logic ---

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const statusResult = params.get("status");
    const orderIdParam = params.get("orderId");
    
    if (statusResult === "success" && orderIdParam) {
      setOrderId(orderIdParam);
      setStep("success");
      // Clear cart
      items.forEach(item => removeFromCart(item.id));
      toast.success("Pagamento confirmado!");
    } else if (statusResult === "failure") {
      toast.error("O pagamento não foi concluído. Tente novamente.");
    }
    
    if (isInitialized && items.length === 0 && step !== "success") {
      navigate("/");
    }
  }, [items, step, navigate, isInitialized]);

  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
  const [showSavedAddresses, setShowSavedAddresses] = useState(false);

  useEffect(() => {
    if (user && step === "shipping") {
      fetchSavedAddresses();
    }
  }, [user, step]);

  const fetchSavedAddresses = async () => {
    const { data, error } = await supabase
      .from("addresses")
      .select("*")
      .order("is_primary", { ascending: false });
    
    if (data && data.length > 0) {
      setSavedAddresses(data);
      const primary = data.find(a => a.is_primary) || data[0];
      applySavedAddress(primary);
    }
  };

  const applySavedAddress = (saved: any) => {
    setAddress({
      zipCode: saved.zip_code,
      street: saved.street,
      number: saved.number || "",
      complement: saved.complement || "",
      neighborhood: saved.neighborhood || "",
      city: saved.city,
      state: saved.state,
      phone: address.phone || saved.phone || "",
      fullName: saved.full_name || ""
    });
    setBuyerData(prev => ({ ...prev, fullName: saved.full_name }));
  };

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
            neighborhood: data.bairro || "",
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
    if (items.length === 0) return null;

    setIsLoading(true);
    try {
      // 1. Create Order
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          user_id: user?.id || null,
          total_amount: finalTotal,
          status: "pending",
          is_guest: !user,
          full_name: buyerData.fullName,
          email: buyerData.email,
          coupon_code: appliedCoupon?.code || null,
          discount_amount: appliedCoupon ? cartTotal - finalTotal : null
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

      // 3. Create Address (Saving checkout snapshot)
      const { error: addrError } = await supabase.from("addresses").insert({
        order_id: order.id,
        user_id: user?.id || null,
        full_name: buyerData.fullName,
        street: address.street,
        number: address.number,
        complement: address.complement,
        neighborhood: address.neighborhood || "Outro",
        zip_code: address.zipCode,
        city: address.city,
        state: address.state,
        phone: address.phone
      });
      if (addrError) throw addrError;

      // 4. Register coupon redemption if coupon was applied
      if (appliedCoupon) {
        const userIdentifier = user?.id || buyerData.email;
        const { error: redemptionError } = await supabase.from("coupon_redemptions").insert({
          coupon_id: appliedCoupon.id,
          user_identifier: userIdentifier,
          order_id: order.id,
          used_at: new Date().toISOString()
        });
        if (redemptionError) {
          console.error("Error registering coupon redemption:", redemptionError);
        }
      }

      setOrderId(order.id);
      toast.success("Pedido gerado com sucesso!");
      return order.id;

    } catch (e: any) {
      toast.error(`Erro: ${e.message}`);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const deliveryDate = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() + 4);
    return date.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });
  }, []);

  // Coupon validation and application
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError("Digite um código de cupom");
      return;
    }

    setValidatingCoupon(true);
    setCouponError("");

    try {
      // Fetch coupon by code
      const { data: coupon, error: couponError } = await supabase
        .from("coupons")
        .select("*")
        .eq("code", couponCode.toUpperCase())
        .single();

      if (couponError || !coupon) {
        setCouponError("Cupom inválido");
        setValidatingCoupon(false);
        return;
      }

      // Check if coupon is active
      if (!coupon.active) {
        setCouponError("Este cupom nÃ£o estÃ¡ ativo");
        setValidatingCoupon(false);
        return;
      }

      // Check if coupon is expired
      if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
        setCouponError("Este cupom expirou");
        setValidatingCoupon(false);
        return;
      }

      // Check if user already used this coupon
      const userIdentifier = user?.id || buyerData.email;
      const { data: existingRedemption, error: redemptionError } = await supabase
        .from("coupon_redemptions")
        .select("*")
        .eq("coupon_id", coupon.id)
        .eq("user_identifier", userIdentifier)
        .maybeSingle();

      if (existingRedemption) {
        setCouponError("Você já utilizou este cupom");
        setValidatingCoupon(false);
        return;
      }

      // Coupon is valid, apply it
      setAppliedCoupon(coupon);
      toast.success(`Cupom ${coupon.code} aplicado com sucesso!`);
    } catch (error: any) {
      console.error("Error validating coupon:", error);
      setCouponError("Erro ao validar cupom");
    } finally {
      setValidatingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
    setCouponError("");
    toast.info("Cupom removido");
  };

  // Calculate final total with discount
  const finalTotal = useMemo(() => {
    if (!appliedCoupon) return cartTotal;

    if (appliedCoupon.discount_type === "percentage") {
      return cartTotal * (1 - appliedCoupon.discount_value / 100);
    } else {
      return Math.max(0, cartTotal - appliedCoupon.discount_value);
    }
  }, [cartTotal, appliedCoupon]);

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
                      Nome Completo {errors.includes("fullName") && <span className="text-red-500 ml-1">?</span>}
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
                      E-mail {errors.includes("email") && <span className="text-red-500 ml-1">âœ•</span>}
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

                  <motion.div animate={errors.includes("documentNumber") ? "shake" : ""} variants={shakeAnimation}>
                    <label className={STYLES.label}>
                      CPF {errors.includes("documentNumber") && <span className="text-red-500 ml-1">✖</span>}
                    </label>
                    <Input 
                      placeholder="000.000.000-00" 
                      value={buyerData.documentNumber} 
                      onChange={e => {
                        // Simple mask for CPF
                        const val = e.target.value.replace(/\D/g, "").substring(0, 11);
                        setBuyerData(prev => ({ ...prev, documentNumber: val }));
                        setErrors(prev => prev.filter(err => err !== "documentNumber"));
                      }}
                      className={`${STYLES.input} ${errors.includes("documentNumber") ? "border-red-500" : ""}`}
                    />
                    <span className="text-[9px] text-muted-foreground mt-2 block tracking-widest uppercase">Necessário para emissão do Pix e Nota Fiscal.</span>
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
                      if (!buyerData.documentNumber || buyerData.documentNumber.length < 11) newErrors.push("documentNumber");
                      
                      if (newErrors.length > 0) {
                        setErrors(newErrors);
                        toast.error("Por favor, preencha os campos marcados corretamente.");
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
                <div className="mb-8">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center text-primary">
                      <MapPin size={20} />
                    </div>
                    <h2 className="font-display text-xl uppercase tracking-widest">Endereço de Entrega</h2>
                  </div>
                  
                  {user && savedAddresses.length > 0 && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-6"
                    >
                      <button 
                        type="button"
                        onClick={() => setShowSavedAddresses(!showSavedAddresses)}
                        className="text-[10px] tracking-widest text-primary uppercase font-bold hover:underline py-2 flex items-center gap-2"
                      >
                        <ShieldCheck size={14} /> {showSavedAddresses ? "Ocultar meus endereços" : "Usar um endereço salvo"}
                      </button>
                      
                      <AnimatePresence>
                        {showSavedAddresses && (
                          <motion.div 
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="grid grid-cols-1 md:grid-cols-2 gap-3 overflow-hidden mt-4"
                          >
                            {savedAddresses.map((sa) => (
                              <button
                                key={sa.id}
                                type="button"
                                onClick={() => {
                                  applySavedAddress(sa);
                                  setShowSavedAddresses(false);
                                  toast.success(`Endereço "${sa.full_name}" aplicado.`);
                                }}
                                className={`text-left p-4 border transition-all ${
                                  address.zipCode === sa.zip_code && address.number === sa.number
                                  ? "bg-white/10 border-primary"
                                  : "bg-white/[0.02] border-white/5 hover:border-white/20"
                                }`}
                              >
                                <div className="flex justify-between items-start mb-1">
                                  <span className="font-display text-[9px] tracking-widest uppercase truncate">{sa.full_name}</span>
                                  {sa.is_primary && <Star size={10} className="text-primary" fill="currentColor" />}
                                </div>
                                <p className="text-[10px] text-muted-foreground truncate">{sa.street}, {sa.number}</p>
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
                  <motion.div className="md:col-span-2" animate={errors.includes("zipCode") ? "shake" : ""} variants={shakeAnimation}>
                    <label className={STYLES.label}>
                      CEP {errors.includes("zipCode") && <span className="text-red-500 ml-1">âœ•</span>}
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
                      Rua / Logradouro {errors.includes("street") && <span className="text-red-500 ml-1">âœ•</span>}
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
                      Número {errors.includes("number") && <span className="text-red-500 ml-1">?</span>}
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

                  <div className="md:col-span-2">
                    <label className={STYLES.label}>Bairro</label>
                    <Input placeholder="Seu bairro" value={address.neighborhood} onChange={e => setAddress(prev => ({ ...prev, neighborhood: e.target.value }))} className={STYLES.input} />
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
                            Telefone para Entrega {errors.includes("phone") && <span className="ml-1">?</span>}
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

                <div className="flex flex-col md:flex-row items-center gap-6 pt-8">
                  <button 
                    onClick={() => setStep("identification")}
                    className="order-2 md:order-1 text-[10px] tracking-[0.2em] text-muted-foreground hover:text-white transition-colors font-display flex items-center gap-2 uppercase font-bold"
                  >
                    <ArrowLeft size={12} /> Voltar
                  </button>
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
                    className="order-1 md:order-2 w-full md:flex-1 h-14 bg-white text-black font-display tracking-[0.3em] font-bold hover:bg-primary transition-colors text-[11px]"
                  >
                    CONTINUAR PARA PAGAMENTO
                  </Button>
                </div>
              </motion.div>
            )}

            {step === "payment" && (
              <motion.div 
                key="payment" 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0, y: -20 }}
                className="w-full max-w-4xl mx-auto space-y-8"
              >
                {/* Header Bridge */}
                <div className="flex flex-col items-center text-center space-y-4 mb-12">
                  <div className="flex items-center gap-8 relative">
                    <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden">
                      <img src={voidLogo} alt="Voiddrip" className="w-full h-full object-cover opacity-90" />
                    </div>
                    
                    {/* Secure Energy Line Animation */}
                    <div className="w-32 h-px bg-white/10 relative overflow-hidden">
                      <motion.div 
                        initial={{ left: "-100%" }}
                        animate={{ left: "100%" }}
                        transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                        className="absolute top-0 w-1/2 h-full bg-gradient-to-r from-transparent via-primary/50 to-transparent"
                      />
                    </div>

                    <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden">
                      <div className="w-8 h-8 rounded bg-primary/20 flex items-center justify-center">
                        <CreditCard className="text-primary" size={20} />
                      </div>
                    </div>
                  </div>
                  <h2 className="font-display text-xl tracking-[0.3em] uppercase">Revisão e Pagamento</h2>
                  <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Ambiente 100% Criptografado</p>
                </div>

                {/* Bento Grid Layout: [Items + Payment] [Shipping] */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                  {/* Left Column: Items + Payment Control */}
                  <Card className="md:col-span-8 bg-white/[0.02] border-white/10 overflow-hidden flex flex-col h-fit">
                    <div className="p-6 border-b border-white/5 bg-white/[0.01] flex justify-between items-center">
                      <h3 className="text-[10px] tracking-[0.2em] uppercase font-bold text-muted-foreground flex items-center gap-2">
                        <ShoppingBag size={12} /> Resumo do Pedido
                      </h3>
                      <div className="text-[10px] font-mono text-primary font-bold">
                        {items.length} {items.length === 1 ? 'ITEM' : 'ITENS'}
                      </div>
                    </div>
                    
                    {/* Items List */}
                    <div className="p-6 space-y-6 max-h-[350px] overflow-y-auto custom-scrollbar border-b border-white/5">
                      {items.map((item) => (
                        <div key={item.id} className="flex gap-4 group">
                          <div className="w-16 h-16 bg-white/5 rounded-lg border border-white/10 overflow-hidden shrink-0">
                            <img src={item.product.image_url?.split(',')[0]} alt={item.product.name} className="w-full h-full object-cover" />
                          </div>
                          <div className="flex-1 flex flex-row items-center justify-between gap-4">
                            <div>
                              <h4 className="text-sm font-bold tracking-tight mb-1">{item.product.name}</h4>
                              <p className="text-[9px] text-muted-foreground uppercase tracking-widest">
                                {item.size || 'Padrão'} | Qtd: {item.quantity}
                              </p>
                            </div>
                            <div className="text-xs font-mono text-white/50">
                              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.product.price * item.quantity)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Integrated Payment Section */}
                    <div className="p-8 bg-white/[0.01] relative overflow-hidden group">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 relative z-10">
                        <div className="space-y-2">
                          <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em]">Valor total</p>
                          <p className="text-4xl font-display text-white tracking-tighter">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(finalTotal)}
                          </p>
                          {appliedCoupon && (
                            <p className="text-[8px] text-primary tracking-widest">
                              {appliedCoupon.discount_type === "percentage"
                                ? `${appliedCoupon.discount_value}% OFF aplicado`
                                : `R$ ${appliedCoupon.discount_value} OFF aplicado`}
                            </p>
                          )}
                          
                          {/* Payment Options Dimension Icons */}
                          <div className="flex items-center gap-3 pt-2 opacity-40">
                            <div className="flex flex-col items-center gap-1">
                               <div className="w-8 h-5 border border-white/20 rounded flex items-center justify-center bg-white/5">
                                 <span className="text-[8px] font-bold">PIX</span>
                               </div>
                            </div>
                            <div className="flex flex-col items-center gap-1">
                               <div className="w-8 h-5 border border-white/20 rounded flex items-center justify-center bg-white/5">
                                 <CreditCard size={10} />
                               </div>
                            </div>
                            <div className="flex flex-col items-center gap-1">
                               <div className="w-8 h-5 border border-white/20 rounded flex items-center justify-center bg-white/5">
                                 <Package size={10} />
                               </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="w-full md:w-72 flex items-center justify-center">
                          <div className="w-full space-y-4">
                             <Button 
                               onClick={async () => {
                                 const createdOrderId = await handleFinalizeOrder();
                                 if (!createdOrderId) return;

                                 const cartItemsMsg = items.map(i => `• ${i.quantity}x ${i.product.name} (${i.size || 'Unico'})`).join("\n");
                                 const message = `*NOVO PEDIDO - VOID DRIP* 🛸\n\n🆔 *Pedido:* #${createdOrderId.slice(0, 8)}\n👤 *Cliente:* ${buyerData.fullName}\n📧 *E-mail:* ${buyerData.email}\n📞 *Tel:* ${address.phone}\n\n📦 *Itens:*\n${cartItemsMsg}\n\n📍 *Entrega:*\n${address.street}, ${address.number}\n${address.city}/${address.state}\n\n💰 *Total:* ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(finalTotal)}`;
                                 
                                 const encodedMsg = encodeURIComponent(message);
                                 const whatsappUrl = `https://wa.me/5571983789492?text=${encodedMsg}`;
                                 
                                 // Limpa o carrinho e vai para a tela de sucesso primeiro para garantir o estado
                                 items.forEach(item => removeFromCart(item.id));
                                 setStep("success");
                                 
                                 // Pequeno delay para garantir que o estado do React foi processado antes do redirecionamento pesado
                                 setTimeout(() => {
                                   window.location.href = whatsappUrl;
                                 }, 100);
                               }}
                               className="w-full h-16 text-[11px] tracking-[0.3em] font-bold uppercase relative overflow-hidden group bg-[#25D366] text-black hover:bg-[#20ba5a] transition-all duration-500 shadow-[0_0_20px_rgba(37,211,102,0.3)] hover:shadow-[0_0_35px_rgba(37,211,102,0.6)]"
                             >
                               <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                               <div className="flex items-center justify-center gap-3 relative z-10">
                                 <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="drop-shadow-sm"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.067 2.877 1.215 3.076.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                                 Finalizar no WhatsApp
                               </div>
                             </Button>
                             <p className="text-[8px] text-center text-muted-foreground uppercase tracking-widest font-medium opacity-50">
                               Pague via Pix ou Cartão com nossos atendentes
                             </p>
                           </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-8 mt-8 border-t border-white/5 opacity-80">
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] text-white/60 font-medium uppercase tracking-widest">Pagamento 100% Seguro</span>
                        </div>
                        <div className="flex items-center gap-1.5 px-2 py-1 bg-primary/10 border border-primary/20 rounded-md">
                          <ShieldCheck size={10} className="text-primary" />
                          <span className="text-[8px] text-primary font-bold uppercase tracking-tighter">Compra Garantida</span>
                        </div>
                      </div>
                    </div>
                  </Card>

                  {/* Right Column: Delivery Info Only */}
                  <div className="md:col-span-4 h-fit">
                    <Card className="bg-white/[0.02] border-white/10 p-6 space-y-6">
                      <div className="flex flex-col space-y-4">
                        <h3 className="text-[10px] tracking-[0.2em] uppercase font-bold text-muted-foreground flex items-center gap-2">
                          <MapPin size={12} /> Entrega Prioritária
                        </h3>
                        
                        <div className="space-y-4">
                          <div className="space-y-1">
                            <p className="text-[12px] text-white font-bold uppercase tracking-tight">{address.fullName || buyerData.fullName}</p>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-widest leading-relaxed">
                              {address.street}, {address.number}<br/>
                              {address.complement && `${address.complement} - `}{address.neighborhood}<br/>
                              {address.city}, {address.state} - {address.zipCode}
                            </p>
                          </div>
                          
                          <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-lg border border-primary/10">
                            <Clock className="w-4 h-4 text-primary animate-pulse" />
                            <div>
                              <p className="text-[8px] text-white/50 uppercase tracking-widest">Previsão de Chegada</p>
                              <p className="text-[10px] text-primary font-bold uppercase tracking-widest">Receba até {deliveryDate.split(',')[1]}</p>
                            </div>
                          </div>
                        </div>

                        <div className="pt-4 border-t border-white/5">
                           <p className="text-[9px] text-muted-foreground/60 leading-relaxed uppercase tracking-tighter">
                             O prazo de envio começa a contar após a confirmação do pagamento. Você receberá o código de rastreio via e-mail.
                           </p>
                        </div>
                      </div>
                    </Card>
                  </div>
                </div>

                <button 
                  onClick={() => setStep("shipping")}
                  disabled={isLoading}
                  className="mx-auto text-[10px] tracking-[0.2em] text-muted-foreground hover:text-white transition-colors flex items-center gap-2 uppercase font-bold py-4"
                >
                  <ArrowLeft size={12} /> Alterar endereço ou itens
                </button>
              </motion.div>
            )}

            {step === "success" && (
              <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center text-center max-w-xl mx-auto py-12">
                <div className="w-24 h-24 bg-primary/20 rounded-full flex items-center justify-center text-primary mb-8 animate-in zoom-in duration-500">
                    <CheckCircle2 size={48} />
                </div>
                <h1 className="font-display text-3xl uppercase tracking-[0.2em] mb-4">PEDIDO REALIZADO</h1>
                <p className="text-muted-foreground mb-4">Sua vaga no VOID está garantida. Pedido <span className="text-white font-bold">#{orderId?.slice(0, 8)}</span>.</p>
                <div className="flex items-center gap-2 mb-12 text-primary text-[10px] tracking-widest uppercase font-bold animate-pulse">
                  <div className="w-2 h-2 bg-primary rounded-full" />
                  Redirecionando para o WhatsApp...
                </div>
                
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

                {/* Coupon Input */}
                <div className="space-y-3 pt-6 border-t border-white/5">
                  {!appliedCoupon ? (
                    <div className="space-y-2">
                      <label className="text-[9px] tracking-[0.2em] text-muted-foreground uppercase">Cupom de Desconto</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                          placeholder="CÓDIGO"
                          className="flex-1 bg-black/40 border border-white/10 px-4 py-3 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-colors uppercase"
                          onKeyPress={(e) => e.key === "Enter" && handleApplyCoupon()}
                        />
                        <button
                          onClick={handleApplyCoupon}
                          disabled={validatingCoupon}
                          className="px-6 py-3 bg-white text-black text-[10px] font-bold tracking-widest uppercase hover:bg-primary transition-colors disabled:opacity-50"
                        >
                          {validatingCoupon ? "..." : "APLICAR"}
                        </button>
                      </div>
                      {couponError && (
                        <p className="text-[8px] text-red-400 tracking-widest">{couponError}</p>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-between p-3 bg-primary/10 border border-primary/20 rounded-none">
                      <div className="flex items-center gap-2">
                        <Ticket size={16} className="text-primary" />
                        <div>
                          <span className="text-[10px] font-bold tracking-widest text-primary">{appliedCoupon.code}</span>
                          <span className="text-[8px] text-muted-foreground ml-2">
                            {appliedCoupon.discount_type === "percentage"
                              ? `${appliedCoupon.discount_value}% OFF`
                              : `R$ ${appliedCoupon.discount_value} OFF`}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={handleRemoveCoupon}
                        className="text-[8px] text-muted-foreground hover:text-red-400 transition-colors tracking-widest"
                      >
                        REMOVER
                      </button>
                    </div>
                  )}
                </div>

                <div className="space-y-3 pt-6 border-t border-white/5">
                   <div className="flex justify-between text-[10px] tracking-widest text-muted-foreground uppercase">
                      <span>Subtotal</span>
                      <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cartTotal)}</span>
                   </div>
                   {appliedCoupon && (
                     <div className="flex justify-between text-[10px] tracking-widest text-primary uppercase">
                        <span>Desconto ({appliedCoupon.code})</span>
                        <span>-{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cartTotal - finalTotal)}</span>
                     </div>
                   )}
                   <div className="flex justify-between text-[10px] tracking-widest text-primary uppercase font-bold">
                      <span>Frete</span>
                      <span>GRÃTIS</span>
                   </div>
                   <div className="flex justify-between items-end pt-4">
                      <span className="font-display text-sm tracking-widest">TOTAL</span>
                      <span className="font-display text-2xl tracking-wider text-white">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(finalTotal)}
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
        mode="checkout"
      />
    </div>
  );
}

