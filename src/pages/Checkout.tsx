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
  ShoppingBag,
  Star
} from "lucide-react";
import { AuthModal } from "@/components/AuthModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

declare global {
  interface Window {
    cardPaymentBrickController: any;
  }
}

// --- Types & Constants ---
type CheckoutStep = "identification" | "shipping" | "payment" | "success";

interface IdentificationType {
  id: string;
  name: string;
  type: string;
  min_length: number;
  max_length: number;
}

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
  const [identificationTypes, setIdentificationTypes] = useState<IdentificationType[]>([]);
  const [pixData, setPixData] = useState<{
    qr_code: string;
    qr_code_base64: string;
    ticket_url: string;
  } | null>(null);
  const [mpOrderId, setMpOrderId] = useState<string | null>(null);

  // Shake animation configuration
  const shakeAnimation = {
    shake: {
      x: [0, -10, 10, -10, 10, 0],
      transition: { duration: 0.4 }
    }
  };

  // Initialize Mercado Pago & Fetch ID Types
  useEffect(() => {
    const setupMP = async () => {
      const { initMercadoPago } = await import("@/integrations/mercadopago");
      const mp = await initMercadoPago();
      if (mp) {
        try {
          const types = await mp.getIdentificationTypes();
          setIdentificationTypes(types);
          if (types.length > 0) {
            setBuyerData(prev => ({ ...prev, identificationType: types[0].id }));
          }
        } catch (e) {
          console.error("Error fetching identification types:", e);
        }
      }
    };
    setupMP();

    return () => {
      if (window.cardPaymentBrickController) {
        window.cardPaymentBrickController.unmount();
      }
    };
  }, []);

  // Form States - Identification
  const [buyerData, setBuyerData] = useState({
    firstName: "",
    lastName: "",
    email: user?.email || "",
    identificationType: "CPF",
    identificationNumber: "",
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

  // Card Payment Brick Initialization
  useEffect(() => {
    if (step === "payment" && paymentMethod === "card" && buyerData.email) {
      const renderCardBrick = async () => {
        const { initMercadoPago } = await import("@/integrations/mercadopago");
        const mp = await initMercadoPago();
        if (mp) {
          const bricksBuilder = mp.bricks();
          
          const settings = {
            initialization: {
              amount: cartTotal,
              payer: {
                email: buyerData.email,
              },
            },
            customization: {
              visual: {
                style: {
                  theme: 'dark',
                }
              }
            },
            callbacks: {
              onReady: () => {
                setIsLoading(false);
              },
              onSubmit: (formData: any, additionalData: any) => {
                return new Promise<void>((resolve, reject) => {
                  // We need the orderId from a pre-created order in Supabase
                  // But the onSubmit is called AFTER the user confirms.
                  // We'll create the order in Supabase RIGHT NOW.
                  
                  const createPreOrder = async () => {
                    try {
                      // 1. Create Order
                      const { data: order, error: orderError } = await supabase
                        .from("orders")
                        .insert({
                          user_id: user?.id || null,
                          total_amount: cartTotal,
                          status: "pending",
                          is_guest: !user,
                          full_name: `${buyerData.firstName} ${buyerData.lastName}`,
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
                      await supabase.from("order_items").insert(orderItems);

                      // 3. Create Address
                      await supabase.from("addresses").insert({
                        order_id: order.id,
                        user_id: user?.id || null,
                        full_name: `${buyerData.firstName} ${buyerData.lastName}`,
                        street: address.street,
                        number: address.number,
                        zip_code: address.zipCode,
                        city: address.city,
                        state: address.state,
                        phone: address.phone,
                        neighborhood: "Centro"
                      });

                      // 4. Hit Backend
                      const res = await fetch("/api/checkout", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          items,
                          buyer: buyerData,
                          paymentMethod: "card",
                          cardToken: formData.token,
                          installments: formData.installments,
                          issuerId: formData.issuer_id,
                          paymentMethodId: formData.payment_method_id,
                          paymentTypeId: additionalData?.paymentTypeId,
                          orderId: order.id
                        })
                      });
                      
                      const data = await res.json();
                      if (!res.ok) throw new Error(data.error);

                      // 5. Save Transaction
                      await supabase.from("transactions").insert({
                        order_id: order.id,
                        payment_id: data.payment_id,
                        payment_method: data.gateway_response.transactions.payments[0].payment_method.id,
                        status: data.status === "processed" ? "approved" : data.status,
                        amount: cartTotal,
                        installments: formData.installments,
                        gateway_response: data.gateway_response
                      });

                      setOrderId(order.id);
                      setStep("success");
                      items.forEach(item => removeFromCart(item.id));
                      resolve();
                    } catch (e: any) {
                      toast.error(`Erro no cartão: ${e.message}`);
                      reject(e);
                    }
                  };

                  createPreOrder();
                });
              },
              onError: (error: any) => {
                console.error("Card Brick Error:", error);
                toast.error("Erro no formulário de pagamento.");
              },
            },
          };

          if (window.cardPaymentBrickController) {
            await window.cardPaymentBrickController.unmount();
          }

          window.cardPaymentBrickController = await bricksBuilder.create(
            "cardPayment",
            "cardPaymentBrick_container",
            settings
          );
        }
      };
      
      renderCardBrick();
    } else {
      if (window.cardPaymentBrickController) {
        window.cardPaymentBrickController.unmount();
        window.cardPaymentBrickController = null;
      }
    }
  }, [step, paymentMethod, cartTotal, buyerData.email]);

  // Auto-scroll to top when step changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setErrors([]); 
  }, [step]);

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
      number: saved.number,
      complement: saved.complement || "",
      city: saved.city,
      state: saved.state,
      phone: address.phone 
    });
    const nameParts = (saved.full_name || "").split(" ");
    setBuyerData(prev => ({ 
      ...prev, 
      firstName: nameParts[0] || "",
      lastName: nameParts.slice(1).join(" ") || ""
    }));
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
          full_name: `${buyerData.firstName} ${buyerData.lastName}`,
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
      await supabase.from("order_items").insert(orderItems);

      // 3. Create Address
      await supabase.from("addresses").insert({
        order_id: order.id,
        user_id: user?.id || null,
        full_name: `${buyerData.firstName} ${buyerData.lastName}`,
        street: address.street,
        number: address.number,
        complement: address.complement,
        neighborhood: "Centro",
        zip_code: address.zipCode,
        city: address.city,
        state: address.state,
        phone: address.phone
      });

      // 4. Create Mercado Pago Payment
      const mpResponse = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items,
          buyer: buyerData,
          paymentMethod,
          orderId: order.id
        })
      });

      const mpData = await mpResponse.json();
      if (!mpResponse.ok) throw new Error(mpData.error || "Erro ao processar pagamento");

      // Save Transaction Reference in Supabase
      const { error: transError } = await supabase.from("transactions").insert({
        order_id: order.id,
        payment_id: mpData.payment_id,
        payment_method: paymentMethod,
        status: mpData.status === "processed" ? "approved" : mpData.status,
        amount: cartTotal,
        gateway_response: mpData.gateway_response
      });
      if (transError) console.error("Error saving transaction details:", transError);

      // 5. Success Tasks
      setOrderId(order.id);
      
      if (mpData.pix) {
        setPixData(mpData.pix);
        setMpOrderId(mpData.id);
      }
      
      setStep("success");
      items.forEach(item => removeFromCart(item.id));

    } catch (e: any) {
      toast.error(`Erro: ${e.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelPayment = async () => {
    if (!mpOrderId) return;
    
    setIsLoading(true);
    try {
      const response = await fetch("/api/cancel-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: mpOrderId })
      });
      
      if (response.ok) {
        toast.success("Pagamento cancelado com sucesso.");
        setPixData(null);
        setMpOrderId(null);
        navigate("/");
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao cancelar.");
      }
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <motion.div animate={errors.includes("firstName") ? "shake" : ""} variants={shakeAnimation}>
                      <label className={STYLES.label}>Nome {errors.includes("firstName") && <span className="text-red-500 ml-1">✕</span>}</label>
                      <Input placeholder="Seu nome" value={buyerData.firstName} onChange={e => setBuyerData(p => ({ ...p, firstName: e.target.value }))} className={STYLES.input} />
                    </motion.div>
                    <motion.div animate={errors.includes("lastName") ? "shake" : ""} variants={shakeAnimation}>
                      <label className={STYLES.label}>Sobrenome {errors.includes("lastName") && <span className="text-red-500 ml-1">✕</span>}</label>
                      <Input placeholder="Seu sobrenome" value={buyerData.lastName} onChange={e => setBuyerData(p => ({ ...p, lastName: e.target.value }))} className={STYLES.input} />
                    </motion.div>
                  </div>
                  <motion.div animate={errors.includes("email") ? "shake" : ""} variants={shakeAnimation}>
                    <label className={STYLES.label}>E-mail {errors.includes("email") && <span className="text-red-500 ml-1">✕</span>}</label>
                    <Input placeholder="seu@e-mail.com" value={buyerData.email} onChange={e => setBuyerData(p => ({ ...p, email: e.target.value }))} disabled={!!user} className={STYLES.input} />
                  </motion.div>
                </div>

                <div className="flex justify-end pt-8">
                  <Button onClick={() => setStep("shipping")} className="w-full md:w-auto px-12 h-14 bg-white text-black font-display tracking-[0.3em] font-bold hover:bg-primary text-[11px]">
                    CONTINUAR PARA ENTREGA
                  </Button>
                </div>
              </motion.div>
            )}

            {step === "shipping" && (
              <motion.div key="shipping" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className={STYLES.stepContainer}>
                <div className="mb-8 flex items-center gap-4">
                  <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center text-primary">
                    <MapPin size={20} />
                  </div>
                  <h2 className="font-display text-xl uppercase tracking-widest">Endereço de Entrega</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
                  <div className="md:col-span-2">
                    <label className={STYLES.label}>CEP</label>
                    <Input placeholder="00000-000" value={address.zipCode} onChange={e => handleZipCodeLookup(e.target.value)} className={STYLES.input} />
                  </div>
                  <div className="md:col-span-4">
                    <label className={STYLES.label}>Rua / Logradouro</label>
                    <Input placeholder="Nome da rua" value={address.street} onChange={e => setAddress(p => ({ ...p, street: e.target.value }))} className={STYLES.input} />
                  </div>
                  <div className="md:col-span-2">
                    <label className={STYLES.label}>Número</label>
                    <Input placeholder="123" value={address.number} onChange={e => setAddress(p => ({ ...p, number: e.target.value }))} className={STYLES.input} />
                  </div>
                  <div className="md:col-span-4">
                    <label className={STYLES.label}>Complemento</label>
                    <Input placeholder="Apto, bloco (Opcional)" value={address.complement} onChange={e => setAddress(p => ({ ...p, complement: e.target.value }))} className={STYLES.input} />
                  </div>
                  <div className="md:col-span-3">
                    <label className={STYLES.label}>Cidade</label>
                    <Input value={address.city} readOnly className={STYLES.input} />
                  </div>
                  <div className="md:col-span-3">
                    <label className={STYLES.label}>Estado</label>
                    <Input value={address.state} readOnly className={STYLES.input} />
                  </div>
                  <div className="md:col-span-6 border-t border-white/5 pt-6 mt-4">
                    <label className={STYLES.label}>Telefone para Entrega</label>
                    <Input placeholder="(00) 00000-0000" value={address.phone} onChange={e => setAddress(p => ({ ...p, phone: e.target.value }))} className={STYLES.input} />
                  </div>
                </div>

                <div className="flex flex-col md:flex-row items-center gap-6 pt-8">
                  <Button variant="ghost" onClick={() => setStep("identification")} className="order-2 md:order-1 font-display uppercase tracking-widest text-[10px]">
                    <ArrowLeft size={12} className="mr-2" /> Voltar
                  </Button>
                  <Button onClick={() => setStep("payment")} className="order-1 md:order-2 w-full md:flex-1 h-14 bg-white text-black font-display tracking-[0.3em] font-bold hover:bg-primary text-[11px]">
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
                          : "bg-white/[0.02] border-white/5"
                        }`}
                     >
                        <div className="flex items-center gap-4">
                           <span className="text-2xl">{method.icon}</span>
                           <h4 className="font-display text-xs tracking-widest uppercase">{method.label}</h4>
                        </div>
                        {paymentMethod === method.id && <Check size={16} className="text-primary" />}
                     </button>
                   ))}
                </div>

                <AnimatePresence>
                  {paymentMethod === "pix" && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="space-y-6 pb-8">
                      <div className="bg-white/5 border border-white/10 p-6 rounded-xl grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="md:col-span-1">
                          <label className={STYLES.label}>Tipo de Documento</label>
                          <select 
                            value={buyerData.identificationType} 
                            onChange={e => setBuyerData(p => ({ ...p, identificationType: e.target.value }))}
                            className={`${STYLES.input} w-full rounded-md border text-sm px-3 bg-[#1a1a1a]`}
                          >
                            {identificationTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                          </select>
                        </div>
                        <div className="md:col-span-2">
                          <label className={STYLES.label}>Número do Documento</label>
                          <Input value={buyerData.identificationNumber} onChange={e => setBuyerData(p => ({ ...p, identificationNumber: e.target.value }))} className={STYLES.input} />
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {paymentMethod === "card" && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="pb-8">
                       <div id="cardPaymentBrick_container"></div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex flex-col md:flex-row items-center gap-6">
                  <Button variant="ghost" onClick={() => setStep("shipping")} className="order-2 md:order-1 font-display uppercase tracking-widest text-[10px]">
                    <ArrowLeft size={12} className="mr-2" /> Voltar
                  </Button>
                  <Button 
                    onClick={handleFinalizeOrder}
                    disabled={isLoading}
                    style={{ display: paymentMethod === "card" ? "none" : "flex" }}
                    className="order-1 md:order-2 w-full md:flex-1 btn-neon-green h-14 font-bold tracking-[0.3em] transition-all text-[11px]"
                  >
                    {isLoading ? <Loader2 className="animate-spin" /> : `FECHAR PEDIDO DE ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cartTotal)}`}
                  </Button>
                </div>
              </motion.div>
            )}

            {step === "success" && (
              <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center text-center max-w-xl mx-auto py-12">
                <div className="w-24 h-24 bg-primary/20 rounded-full flex items-center justify-center text-primary mb-8">
                    <CheckCircle2 size={48} />
                </div>
                <h1 className="font-display text-3xl uppercase tracking-[0.2em] mb-4">
                  {pixData ? "PAGAMENTO PENDENTE" : "PEDIDO REALIZADO"}
                </h1>
                <p className="text-muted-foreground mb-12">
                  {pixData ? "Finalize o pagamento via Pix para confirmar seu pedido." : "Sua vaga no VOID está garantida."}
                </p>
                
                {pixData && (
                  <div className="w-full max-sm mb-12 space-y-8">
                     <div className="bg-white p-4 rounded-2xl inline-block mx-auto shadow-2xl">
                        <img src={`data:image/png;base64,${pixData.qr_code_base64}`} alt="QR Code Pix" className="w-48 h-48" />
                     </div>
                     <div className="space-y-4">
                        <div className="bg-white/5 border border-white/10 p-4 rounded-xl flex flex-col items-center gap-3">
                           <code className="text-[10px] break-all text-primary">{pixData.qr_code}</code>
                           <Button onClick={() => { navigator.clipboard.writeText(pixData.qr_code); toast.success("Copiado!"); }} className="w-full text-[10px] font-bold">COPIAR CÓDIGO</Button>
                        </div>
                        <a href={pixData.ticket_url} target="_blank" className="text-[10px] text-primary font-bold uppercase underline">Abrir no Mercado Pago</a>
                     </div>
                  </div>
                )}

                <div className="flex flex-col gap-4 w-full">
                  <Button onClick={() => navigate("/")} className="px-12 h-14 border border-white/20 bg-transparent text-white hover:bg-white hover:text-black tracking-[0.3em]">
                    VOLTAR À LOJA
                  </Button>

                  {pixData && (
                   <button onClick={handleCancelPayment} disabled={isLoading} className="mt-4 text-[10px] text-red-500/40 hover:text-red-500 font-bold uppercase">
                     CANCELAR PAGAMENTO E PEDIDO
                   </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Sidebar Summary */}
        {step !== "success" && (
          <aside className="lg:col-span-12 xl:col-span-4 h-fit sticky top-20 xl:top-40">
             <div className="bg-[#050505] border border-white/5 p-8 rounded-2xl shadow-2xl">
                <div className="flex items-center gap-2 mb-8 uppercase text-[10px] tracking-widest font-display">
                   <ShoppingBag size={14} className="text-white/50" /> Resumo
                </div>
                <div className="space-y-4 mb-8 max-h-[300px] overflow-y-auto no-scrollbar">
                   {items.map(item => (
                     <div key={item.id} className="flex gap-4 items-center">
                        <div className="w-10 h-12 bg-black border border-white/10 rounded overflow-hidden">
                           <img src={item.product.image_url?.split(',')[0]} className="w-full h-full object-cover opacity-60" />
                        </div>
                        <div className="flex-1 min-w-0">
                           <h5 className="font-display text-[9px] uppercase truncate tracking-widest">{item.product.name}</h5>
                           <p className="text-[9px] text-muted-foreground uppercase">{item.size} | {item.quantity}un</p>
                        </div>
                        <span className="font-display text-[10px]">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.product.price * item.quantity)}
                        </span>
                     </div>
                   ))}
                </div>
                <div className="pt-6 border-t border-white/5 space-y-3">
                   <div className="flex justify-between text-[10px] uppercase tracking-widest">
                      <span>Subtotal</span>
                      <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cartTotal)}</span>
                   </div>
                   <div className="flex justify-between items-end pt-4 font-display">
                      <span className="text-xs">TOTAL</span>
                      <span className="text-2xl text-white">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cartTotal)}
                      </span>
                   </div>
                </div>
             </div>
          </aside>
        )}
      </main>

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} onSuccess={() => setIsAuthModalOpen(false)} mode="checkout" />
    </div>
  );
}
