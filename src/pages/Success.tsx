import { useEffect, useState, useMemo } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, ShoppingBag, ArrowRight, Truck, ShieldCheck, Instagram, MessageCircle, Info, Star, ChevronRight, Clock, Package, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useCart } from "@/contexts/CartContext";
import { supabase } from "@/integrations/supabase/client";
import { useProducts } from "@/hooks/useProducts";
import ProductCard from "@/components/ProductCard";

export default function Success() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const orderId = searchParams.get("external_reference") || searchParams.get("orderId") || searchParams.get("preference_id");
  const { clearCart } = useCart();
  const [order, setOrder] = useState<any>(null);
  const [isValidating, setIsValidating] = useState(true);
  const { data: allProducts = [] } = useProducts();

  // Cross-selling: 3 random products that are different from the current order
  const crossSellProducts = useMemo(() => {
    return allProducts
      .filter(p => p.stock_quantity > 0)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);
  }, [allProducts]);

  useEffect(() => {
    async function validateOrder() {
      if (!orderId) {
        setIsValidating(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("orders")
          .select("*, order_items(*, product:products(*))")
          .eq("id", orderId)
          .single();

        if (data) {
          setOrder(data);
          
          // TRACKING: GA4 Purchase Event
          if (window.dataLayer) {
            window.dataLayer.push({
              event: 'purchase',
              ecommerce: {
                transaction_id: data.id,
                value: data.total_amount,
                currency: 'BRL',
                items: data.order_items.map((item: any) => ({
                  item_id: item.product_id,
                  item_name: item.product.name,
                  price: item.price,
                  quantity: item.quantity
                }))
              }
            });
          }

          // TRACKING: Meta Pixel Purchase
          if (window.fbq) {
            window.fbq('track', 'Purchase', {
              value: data.total_amount,
              currency: 'BRL',
              content_ids: data.order_items.map((item: any) => item.product_id),
              content_type: 'product'
            }, { eventID: `purchase_${data.id}` });
          }
        }
      } catch (err) {
        console.error("Error validating order:", err);
      } finally {
        setIsValidating(false);
      }
    }

    validateOrder();
    clearCart();
    window.scrollTo(0, 0);
  }, [orderId, clearCart]);

  const deliveryDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 5);
    return d.toLocaleDateString("pt-BR", { day: "numeric", month: "long" });
  }, []);

  if (isValidating) {
    return (
      <div className="min-h-screen bg-[#030303] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-t-2 border-primary rounded-full animate-spin" />
          <p className="font-display text-[10px] tracking-[0.3em] uppercase text-muted-foreground">Sincronizando com a Void...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#030303] text-white flex flex-col">
      <Navbar />
      
      <main className="flex-grow container mx-auto px-6 py-24">
        {/* Success Header */}
        <div className="flex flex-col items-center text-center space-y-6 mb-16">
          <motion.div 
            initial={{ opacity: 0, scale: 0.5, rotate: -20 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className="relative"
          >
            <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
            <div className="relative w-24 h-24 bg-white/5 border border-white/10 rounded-3xl flex items-center justify-center text-primary backdrop-blur-xl">
              <CheckCircle2 size={48} className="drop-shadow-[0_0_15px_rgba(var(--primary),0.5)]" />
            </div>
          </motion.div>
          
          <div className="space-y-2">
            <h1 className="font-display text-2xl md:text-3xl uppercase tracking-[0.3em] font-bold">CONEXÃO ESTABELECIDA</h1>
            <p className="text-muted-foreground max-w-lg mx-auto tracking-[0.15em] text-[10px] md:text-xs uppercase font-medium leading-relaxed">
              Você garantiu seu drop. O próximo nível começa agora. <br className="hidden md:block" />
              Sua presença foi registrada no vazio.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-7xl mx-auto">
          {/* Main Content: Bento Grid Left */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Status Tracker Box */}
            <Card className="bg-white/[0.02] border-white/10 p-8 overflow-hidden relative group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
              
              <div className="relative z-10 space-y-8">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Status do Pedido</span>
                    <h3 className="text-lg font-bold tracking-tight">#{orderId?.slice(0, 8).toUpperCase() || "VOID"}</h3>
                  </div>
                  <div className="px-3 py-1 bg-primary/10 border border-primary/20 rounded-full">
                    <span className="text-[9px] text-primary font-bold uppercase tracking-widest">Processando</span>
                  </div>
                </div>

                {/* Tracking Visual */}
                <div className="relative flex justify-between items-center px-2">
                  <div className="absolute top-[18px] left-0 right-0 h-[2px] bg-white/5" />
                  <div className="absolute top-[18px] left-0 w-1/4 h-[2px] bg-primary shadow-[0_0_10px_rgba(var(--primary),0.5)]" />
                  
                  {[
                    { icon: ShoppingBag, label: "Confirmado", active: true },
                    { icon: Package, label: "Preparando", active: false },
                    { icon: Truck, label: "Em Rota", active: false },
                    { icon: MapPin, label: "Entregue", active: false },
                  ].map((s, i) => (
                    <div key={i} className="relative z-10 flex flex-col items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all duration-500 ${s.active ? 'bg-primary border-primary text-black shadow-lg shadow-primary/20' : 'bg-[#050505] border-white/10 text-white/30'}`}>
                        <s.icon size={18} />
                      </div>
                      <span className={`text-[8px] uppercase tracking-widest font-bold ${s.active ? 'text-white' : 'text-white/20'}`}>{s.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            {/* Cross-selling: Complete the Kit */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-xs tracking-[0.3em] uppercase font-bold text-white/80">COMPLETE SEU KIT</h3>
                <div className="h-[1px] flex-1 mx-6 bg-white/5" />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                {crossSellProducts.map((product) => (
                  <div key={product.id} className="group relative">
                    <ProductCard product={product} />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar: Bento Grid Right */}
          <div className="lg:col-span-4 space-y-6 h-fit">
            {/* Delivery Estimative */}
            <Card className="bg-white/[0.02] border-white/10 p-6 flex items-center gap-5 group hover:border-primary/30 transition-colors">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                <Clock size={24} className="group-hover:scale-110 transition-transform" />
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] text-muted-foreground uppercase tracking-widest">Entrega Estimada</span>
                <span className="text-sm font-bold text-white uppercase tracking-tight">Receba até {deliveryDate}</span>
              </div>
            </Card>

            {/* Info & Legal Box */}
            <Card className="bg-white/[0.01] border-white/10 p-6 space-y-8">
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="mt-1 flex-shrink-0 w-6 h-6 border border-white/10 rounded flex items-center justify-center">
                    <Check size={12} className="text-primary" />
                  </div>
                  <div>
                    <h5 className="text-[10px] font-bold uppercase tracking-widest mb-1">Garantia Voiddrip</h5>
                    <p className="text-[9px] text-muted-foreground leading-relaxed uppercase tracking-tighter">
                      Direito de arrependimento garantido de 7 dias após o recebimento.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="mt-1 flex-shrink-0 w-6 h-6 border border-white/10 rounded flex items-center justify-center">
                    <ShieldCheck size={12} className="text-primary" />
                  </div>
                  <div>
                    <h5 className="text-[10px] font-bold uppercase tracking-widest mb-1">Rastreio em Tempo Real</h5>
                    <p className="text-[9px] text-muted-foreground leading-relaxed uppercase tracking-tighter">
                      Você receberá os códigos de monitoramento via e-mail e WhatsApp em até 24h úteis.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-white/5 space-y-4">
                <p className="text-[9px] text-center text-muted-foreground uppercase tracking-widest">Precisa de ajuda com o drop?</p>
                <Button variant="outline" asChild className="w-full h-12 border-white/10 hover:bg-white/5 font-display text-[9px] tracking-[0.2em] uppercase font-bold">
                  <a href="https://wa.me/5511999999999" target="_blank" rel="noopener noreferrer">
                    <MessageCircle size={14} className="mr-2" /> Suporte Conectado
                  </a>
                </Button>
              </div>
            </Card>

            {/* Brand CTA */}
            <Card className="bg-primary p-6 overflow-hidden relative group cursor-pointer" onClick={() => window.open('https://instagram.com/voiddrip', '_blank')}>
               <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 blur-[60px] rounded-full pointer-events-none" />
               <div className="relative z-10 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Instagram size={20} className="text-black" />
                    <div className="flex flex-col text-black">
                       <span className="text-[8px] font-bold uppercase tracking-widest opacity-60">Siga o Vazio</span>
                       <span className="text-[11px] font-bold uppercase tracking-tight italic">@voiddrip</span>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-black group-hover:translate-x-1 transition-transform" />
               </div>
            </Card>

            <Button asChild variant="ghost" className="w-full h-12 text-muted-foreground hover:text-white text-[10px] tracking-[0.4em] uppercase font-bold">
              <Link to="/">Continuar Navegando <ArrowRight size={14} className="ml-2" /></Link>
            </Button>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
