import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CosmicElements from "@/components/CosmicElements";
import { PlusCircle, Trash2, CheckCircle2, XCircle, Clock, Percent, DollarSign, Tag } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";

const ADMIN_EMAIL = "rauanrocha.martech@gmail.com";

const AdminCoupons = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<any>(null);

  // Form states
  const [code, setCode] = useState("");
  const [discountType, setDiscountType] = useState<"percentage" | "fixed">("percentage");
  const [discountValue, setDiscountValue] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [active, setActive] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user || user.email !== ADMIN_EMAIL) {
      navigate("/");
      return;
    }
    fetchCoupons();
  }, [user, navigate]);

  const fetchCoupons = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("coupons")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching coupons:", error);
      toast.error("Erro ao carregar cupons");
    } else {
      setCoupons(data || []);
    }
    setLoading(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const couponData = {
        code: code.toUpperCase(),
        discount_type: discountType,
        discount_value: parseFloat(discountValue),
        expires_at: expiresAt || null,
        active,
        created_by: user?.email,
      };

      let result;
      if (editingCoupon) {
        result = await supabase
          .from("coupons")
          .update(couponData)
          .eq("id", editingCoupon.id);
      } else {
        result = await supabase.from("coupons").insert(couponData);
      }

      if (result.error) throw result.error;

      toast.success(editingCoupon ? "Cupom atualizado!" : "Cupom criado!");
      setShowForm(false);
      setEditingCoupon(null);
      resetForm();
      fetchCoupons();
    } catch (error: any) {
      console.error("Error saving coupon:", error);
      toast.error(error.message || "Erro ao salvar cupom");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este cupom?")) return;

    const { error } = await supabase.from("coupons").delete().eq("id", id);
    if (error) {
      toast.error("Erro ao excluir cupom");
      console.error(error);
    } else {
      toast.success("Cupom excluído");
      fetchCoupons();
    }
  };

  const handleToggleActive = async (coupon: any) => {
    const { error } = await supabase
      .from("coupons")
      .update({ active: !coupon.active })
      .eq("id", coupon.id);

    if (error) {
      toast.error("Erro ao atualizar status");
    } else {
      toast.success(coupon.active ? "Cupom desativado" : "Cupom ativado");
      fetchCoupons();
    }
  };

  const resetForm = () => {
    setCode("");
    setDiscountType("percentage");
    setDiscountValue("");
    setExpiresAt("");
    setActive(true);
  };

  const openEdit = (coupon: any) => {
    setEditingCoupon(coupon);
    setCode(coupon.code);
    setDiscountType(coupon.discount_type);
    setDiscountValue(coupon.discount_value.toString());
    setExpiresAt(coupon.expires_at || "");
    setActive(coupon.active);
    setShowForm(true);
  };

  if (!user || user.email !== ADMIN_EMAIL) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background relative flex flex-col font-display uppercase">
      <Navbar />
      
      <main className="flex-grow pt-32 pb-20 relative px-6 overflow-hidden sm:spacetime-grid">
        <CosmicElements />
        
        <div className="max-w-6xl mx-auto relative z-10">
          <header className="mb-12 flex justify-between items-center">
            <div>
              <h1 className="text-3xl md:text-4xl tracking-[0.2em] bg-clip-text text-transparent bg-gradient-to-r from-white via-white/80 to-white/40 mb-4">
                GERENCIAR CUPONS
              </h1>
              <p className="text-[10px] text-muted-foreground tracking-[0.4em]">
                PAINEL ADMINISTRATIVO
              </p>
            </div>
            <button
              onClick={() => {
                resetForm();
                setEditingCoupon(null);
                setShowForm(true);
              }}
              className="btn-neon-green px-6 py-3 flex items-center gap-2 text-[10px] tracking-[0.2em]"
            >
              <PlusCircle size={16} />
              NOVO CUPOM
            </button>
          </header>

          {/* Form Modal */}
          <AnimatePresence>
            {showForm && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-xl p-4"
              >
                <div className="bg-card border border-white/10 p-8 w-full max-w-lg">
                  <h2 className="text-xl tracking-[0.3em] mb-6">
                    {editingCoupon ? "EDITAR CUPOM" : "NOVO CUPOM"}
                  </h2>
                  <form onSubmit={handleSave} className="space-y-6">
                    <div>
                      <label className="text-[10px] tracking-[0.2em] text-muted-foreground mb-2 block">
                        CÓDIGO DO CUPOM
                      </label>
                      <input
                        type="text"
                        required
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        className="w-full bg-[#050505] border border-white/10 px-4 py-3 text-sm text-white focus:border-primary/50 transition-colors uppercase"
                        placeholder="VOID20"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] tracking-[0.2em] text-muted-foreground mb-2 block">
                        TIPO DE DESCONTO
                      </label>
                      <div className="flex gap-4">
                        <button
                          type="button"
                          onClick={() => setDiscountType("percentage")}
                          className={`flex-1 p-4 border transition-all ${
                            discountType === "percentage"
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-white/10 hover:border-white/30"
                          }`}
                        >
                          <Percent size={20} className="mx-auto mb-2" />
                          <span className="text-[9px] tracking-widest">PORCENTAGEM</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setDiscountType("fixed")}
                          className={`flex-1 p-4 border transition-all ${
                            discountType === "fixed"
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-white/10 hover:border-white/30"
                          }`}
                        >
                          <DollarSign size={20} className="mx-auto mb-2" />
                          <span className="text-[9px] tracking-widest">VALOR FIXO</span>
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] tracking-[0.2em] text-muted-foreground mb-2 block">
                        {discountType === "percentage" ? "PORCENTAGEM (%)" : "VALOR (R$)"}
                      </label>
                      <input
                        type="number"
                        step={discountType === "percentage" ? "1" : "0.01"}
                        min="0"
                        max={discountType === "percentage" ? "100" : undefined}
                        required
                        value={discountValue}
                        onChange={(e) => setDiscountValue(e.target.value)}
                        className="w-full bg-[#050505] border border-white/10 px-4 py-3 text-sm text-white focus:border-primary/50 transition-colors"
                        placeholder={discountType === "percentage" ? "20" : "50"}
                      />
                    </div>

                    <div>
                      <label className="text-[10px] tracking-[0.2em] text-muted-foreground mb-2 block">
                        DATA DE EXPIRAÇÃO (OPCIONAL)
                      </label>
                      <input
                        type="datetime-local"
                        value={expiresAt}
                        onChange={(e) => setExpiresAt(e.target.value)}
                        className="w-full bg-[#050505] border border-white/10 px-4 py-3 text-sm text-white focus:border-primary/50 transition-colors"
                      />
                    </div>

                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="active"
                        checked={active}
                        onChange={(e) => setActive(e.target.checked)}
                        className="w-4 h-4 accent-primary"
                      />
                      <label htmlFor="active" className="text-[10px] tracking-[0.2em]">
                        CUPOM ATIVO
                      </label>
                    </div>

                    <div className="flex gap-4 pt-4">
                      <button
                        type="submit"
                        disabled={saving}
                        className="flex-1 btn-neon-green py-4"
                      >
                        {saving ? "SALVANDO..." : "SALVAR"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowForm(false);
                          setEditingCoupon(null);
                          resetForm();
                        }}
                        className="px-6 border border-white/10 hover:border-white/30 transition-colors"
                      >
                        CANCELAR
                      </button>
                    </div>
                  </form>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Coupons List */}
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-8 h-8 border-y border-primary rounded-full animate-spin" />
            </div>
          ) : coupons.length === 0 ? (
            <div className="text-center py-20 border border-white/5 bg-white/[0.02]">
              <Tag size={40} className="mx-auto text-muted-foreground/30 mb-4" />
              <p className="text-[10px] tracking-[0.3em] text-muted-foreground">NENHUM CUPOM CRIADO</p>
            </div>
          ) : (
            <div className="space-y-4">
              {coupons.map((coupon) => (
                <motion.div
                  key={coupon.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="border border-white/10 bg-card/20 backdrop-blur-xl p-6 flex items-center justify-between gap-6"
                >
                  <div className="flex items-center gap-6">
                    <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center bg-white/5">
                      {coupon.discount_type === "percentage" ? (
                        <Percent size={20} className="text-primary" />
                      ) : (
                        <DollarSign size={20} className="text-primary" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <span className="text-lg font-bold tracking-[0.2em] text-primary">
                          {coupon.code}
                        </span>
                        {coupon.active ? (
                          <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-[8px] tracking-widest border border-green-500/30">
                            ATIVO
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-[8px] tracking-widest border border-red-500/30">
                            INATIVO
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-bold">
                        {coupon.discount_type === "percentage"
                          ? `${coupon.discount_value}% OFF`
                          : `R$ ${coupon.discount_value} OFF`}
                      </p>
                      {coupon.expires_at && (
                        <p className="text-[8px] text-muted-foreground mt-1 flex items-center gap-1">
                          <Clock size={10} />
                          EXPIRA: {new Date(coupon.expires_at).toLocaleDateString("pt-BR")}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleActive(coupon)}
                      className="p-2 border border-white/10 hover:border-white/30 transition-colors"
                      title={coupon.active ? "Desativar" : "Ativar"}
                    >
                      {coupon.active ? (
                        <XCircle size={16} className="text-red-400" />
                      ) : (
                        <CheckCircle2 size={16} className="text-green-400" />
                      )}
                    </button>
                    <button
                      onClick={() => openEdit(coupon)}
                      className="p-2 border border-white/10 hover:border-white/30 transition-colors"
                      title="Editar"
                    >
                      <Tag size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(coupon.id)}
                      className="p-2 border border-white/10 hover:border-red-500/50 transition-colors text-red-400"
                      title="Excluir"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default AdminCoupons;
