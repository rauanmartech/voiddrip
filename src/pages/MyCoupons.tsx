import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CosmicElements from "@/components/CosmicElements";
import { Ticket, Clock, Copy, Check, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

const MyCoupons = () => {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    setLoading(true);
    // Fetch active coupons that haven't expired
    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .eq('active', true)
      .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching coupons:", error);
      toast.error("Erro ao carregar cupons");
    } else {
      setCoupons(data || []);
    }
    setLoading(false);
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success("Código copiado!");
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="min-h-screen bg-background relative flex flex-col font-display uppercase">
      <Navbar />
      
      <main className="flex-grow pt-32 pb-20 relative px-6 overflow-hidden sm:spacetime-grid">
        <CosmicElements />
        
        <div className="max-w-4xl mx-auto relative z-10">
          <header className="mb-12 text-center md:text-left">
            <h1 className="text-3xl md:text-4xl tracking-[0.2em] bg-clip-text text-transparent bg-gradient-to-r from-white via-white/80 to-white/40 mb-4">
              MEUS CUPONS
            </h1>
            <p className="text-[10px] text-muted-foreground tracking-[0.4em]">
              FRAGMENTOS DE DESCONTO NO VAZIO
            </p>
          </header>

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-8 h-8 border-y border-primary rounded-full animate-spin" />
            </div>
          ) : coupons.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <AnimatePresence>
                {coupons.map((coupon, index) => (
                  <motion.div
                    key={coupon.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="group relative border border-white/5 bg-card/20 backdrop-blur-xl p-8 hover:border-primary/20 transition-all duration-500 overflow-hidden"
                  >
                    {/* Decorative Background */}
                    <div className="absolute top-0 right-0 -mr-10 -mt-10 w-32 h-32 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors" />
                    
                    <div className="flex justify-between items-start relative z-10">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-3 text-primary mb-2">
                          <Ticket size={18} />
                          <span className="text-sm font-bold tracking-[0.2em]">{coupon.code}</span>
                        </div>
                        <h3 className="text-2xl font-bold tracking-tight">
                          {coupon.discount_type === 'percentage' 
                            ? `${coupon.discount_value}% OFF` 
                            : `R$ ${coupon.discount_value} OFF`
                          }
                        </h3>
                      </div>
                      <button 
                        onClick={() => copyToClipboard(coupon.code)}
                        className={`p-3 border transition-all duration-300 ${
                          copiedCode === coupon.code 
                            ? "bg-primary border-primary text-black" 
                            : "border-white/10 hover:border-primary/50 text-muted-foreground hover:text-primary"
                        }`}
                      >
                        {copiedCode === coupon.code ? <Check size={16} /> : <Copy size={16} />}
                      </button>
                    </div>

                    <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between relative z-10">
                      <div className="flex items-center gap-2 text-[8px] tracking-[0.2em] text-muted-foreground">
                        <Clock size={12} className="opacity-50" />
                        <span>EXPIRA EM: {coupon.expires_at ? new Date(coupon.expires_at).toLocaleDateString() : 'NUNCA'}</span>
                      </div>
                      <div className="text-[8px] tracking-[0.2em] text-primary/60 italic">
                        USO ÚNICO POR CPF
                      </div>
                    </div>

                    {/* Laser Border on Hover */}
                    <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-700" />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <div className="text-center py-20 border border-white/5 bg-white/[0.02] backdrop-blur-sm">
              <AlertCircle size={40} className="mx-auto text-muted-foreground/30 mb-4" />
              <p className="text-[10px] tracking-[0.3em] text-muted-foreground">NENHUM CUPOM ATIVO NO MOMENTO</p>
              <p className="text-[8px] tracking-[0.2em] text-muted-foreground/50 mt-2 uppercase">FIQUE ATENTO AOS NOSSOS DROPS</p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default MyCoupons;
