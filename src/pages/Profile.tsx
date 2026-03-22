import React, { useState, useEffect, memo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useWishlist } from "@/contexts/WishlistContext";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { motion, AnimatePresence } from "framer-motion";
import { 
  User, 
  MapPin, 
  Plus, 
  Star, 
  Trash2, 
  Edit3, 
  Check, 
  X, 
  Loader2, 
  ArrowRight,
  ChevronRight,
  LogOut,
  ShoppingBag,
  Phone,
  ShieldCheck,
  Smartphone
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface Address {
  id: string;
  full_name: string;
  zip_code: string;
  street: string;
  number: string;
  complement: string | null;
  neighborhood: string;
  city: string;
  state: string;
  is_primary: boolean;
}

interface ProfileData {
  full_name: string | null;
  phone: string | null;
  role: string | null;
}

interface AddressFormProps {
  editingAddress: Address | null;
  profile: ProfileData | null;
  user: any;
  addresses: Address[];
  onClose: () => void;
  onSuccess: () => void;
}

const AddressForm = memo(({ 
  editingAddress, 
  profile, 
  user, 
  addresses, 
  onClose, 
  onSuccess,
}: AddressFormProps) => {
  const [formLoading, setFormLoading] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<Address>>(
    editingAddress || {
      full_name: profile?.full_name || "",
      zip_code: "",
      street: "",
      number: "",
      complement: "",
      neighborhood: "",
      city: "",
      state: "",
    }
  );

  const handleCepLookupInternal = async (cep: string) => {
    const cleanCep = cep.replace(/\D/g, "");
    if (cleanCep.length === 8) {
      setCepLoading(true);
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
        const data = await response.json();
        if (!data.erro) {
          setFormData(prev => ({
            ...prev,
            street: data.logradouro || "",
            neighborhood: data.bairro || "",
            city: data.localidade || "",
            state: data.uf || ""
          }));
          toast.success("Endereço localizado!");
        } else {
          toast.error("CEP não encontrado.");
        }
      } catch (err) {
        console.error(err);
        toast.error("Erro ao buscar CEP.");
      } finally {
        setCepLoading(false);
      }
    }
  };

  const onCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setFormData(prev => ({ ...prev, zip_code: val }));
    if (val.replace(/\D/g, "").length === 8) {
      handleCepLookupInternal(val);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    
    // Preparar payload mantendo o neighborhood se estiver vazio (fallback para Centro como no SQL)
    const payload = {
      ...formData,
      neighborhood: formData.neighborhood || "Centro",
      user_id: user?.id,
      is_primary: editingAddress ? editingAddress.is_primary : addresses.length === 0
    };

    let error;
    if (editingAddress) {
      const { error: err } = await supabase.from("addresses").update(payload).eq("id", editingAddress.id);
      error = err;
    } else {
      const { error: err } = await supabase.from("addresses").insert(payload);
      error = err;
    }

    if (error) {
      console.error("Erro ao salvar endereço:", error);
      toast.error(`Erro ao salvar endereço: ${error.message}`);
    } else {
      toast.success(editingAddress ? "Endereço atualizado!" : "Endereço adicionado!");
      onSuccess();
    }
    setFormLoading(false);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-background/90 backdrop-blur-md p-4"
    >
      <Card className="w-full max-w-lg bg-card border-white/5 p-6 animate-fade-up">
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-display text-xl tracking-widest uppercase">
            {editingAddress ? "Editar Endereço" : "Novo Endereço"}
          </h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-white transition-colors p-2">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-display text-muted-foreground tracking-widest">NOME DO DESTINATÁRIO</label>
            <Input 
              autoFocus
              required 
              value={formData.full_name} 
              onChange={e => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
              className="bg-secondary/30 border-white/10 rounded-none h-12"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-display text-muted-foreground tracking-widest">CEP</label>
              <div className="relative">
                <Input 
                  required 
                  maxLength={9}
                  placeholder="00000-000"
                  value={formData.zip_code} 
                  onChange={onCepChange}
                  className="bg-secondary/30 border-white/10 rounded-none h-12"
                />
                {cepLoading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-primary" size={16} />}
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-display text-muted-foreground tracking-widest">NÚMERO</label>
              <Input 
                required 
                value={formData.number} 
                onChange={e => setFormData(prev => ({ ...prev, number: e.target.value }))}
                className="bg-secondary/30 border-white/10 rounded-none h-12"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-display text-muted-foreground tracking-widest">LOGRADOURO</label>
            <Input 
              required 
              value={formData.street} 
              onChange={e => setFormData(prev => ({ ...prev, street: e.target.value }))}
              className="bg-secondary/30 border-white/10 rounded-none h-12"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-display text-muted-foreground tracking-widest">COMPLEMENTO (OPCIONAL)</label>
              <Input 
                value={formData.complement || ""} 
                onChange={e => setFormData(prev => ({ ...prev, complement: e.target.value }))}
                className="bg-secondary/30 border-white/10 rounded-none h-12"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-display text-muted-foreground tracking-widest">BAIRRO</label>
              <Input 
                required 
                value={formData.neighborhood} 
                onChange={e => setFormData(prev => ({ ...prev, neighborhood: e.target.value }))}
                className="bg-secondary/30 border-white/10 rounded-none h-12"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2 space-y-1">
              <label className="text-[10px] font-display text-muted-foreground tracking-widest">CIDADE</label>
              <Input 
                required 
                value={formData.city} 
                onChange={e => setFormData(prev => ({ ...prev, city: e.target.value }))}
                className="bg-secondary/30 border-white/10 rounded-none h-12"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-display text-muted-foreground tracking-widest">ESTADO</label>
              <Input 
                required 
                maxLength={2}
                value={formData.state} 
                onChange={e => setFormData(prev => ({ ...prev, state: e.target.value.toUpperCase() }))}
                className="bg-secondary/30 border-white/10 rounded-none h-12"
              />
            </div>
          </div>

          <Button disabled={formLoading} className="w-full h-12 rounded-none bg-white text-black font-display text-[10px] tracking-widest uppercase hover:bg-primary transition-all mt-4">
            {formLoading ? <Loader2 className="animate-spin" /> : "Salvar Endereço"}
          </Button>
        </form>
      </Card>
    </motion.div>
  );
});

AddressForm.displayName = "AddressForm";

const Profile = () => {
  const { user, signOut, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  const { wishlistCount } = useWishlist();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [orderCount, setOrderCount] = useState(0);
  const [loading, setLoading] = useState(true);
  
  // Profile editing
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  // Address Modal/Form
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/");
      return;
    }

    if (user) {
      fetchData();
    }
  }, [user, authLoading]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch profile
      const { data: profData } = await supabase
        .from("profiles")
        .select("full_name, role, phone")
        .eq("id", user?.id)
        .single();
      
      if (profData) {
        setProfile(profData);
        setNewName(profData.full_name || "");
        setNewPhone(profData.phone || "");
      }

      // Fetch addresses
      const { data: addrData } = await supabase
        .from("addresses")
        .select("*")
        .eq("user_id", user?.id) // Garantir filtro por usuário logado
        .order("is_primary", { ascending: false })
        .order("created_at", { ascending: false });
      
      setAddresses(addrData || []);

      // Fetch order count
      const { count: ordCount } = await supabase
        .from("orders")
        .select("*", { count: 'exact', head: true })
        .eq("user_id", user?.id);
      
      setOrderCount(ordCount || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    if (!newName.trim()) {
      toast.error("O nome é obrigatório");
      return;
    }
    setSavingProfile(true);
    const { error } = await supabase
      .from("profiles")
      .update({ 
        full_name: newName,
        phone: newPhone
      })
      .eq("id", user?.id);
    
    if (error) {
      toast.error(`Erro ao atualizar perfil: ${error.message}`);
    } else {
      setProfile(prev => prev ? { ...prev, full_name: newName, phone: newPhone } : null);
      setIsEditingProfile(false);
      toast.success("Perfil atualizado!");
    }
    setSavingProfile(false);
  };

  const handleSetPrimary = async (id: string) => {
    // Optimistic UI
    setAddresses(prev => prev.map(a => ({
      ...a, 
      is_primary: a.id === id
    })));

    const { error } = await supabase
      .from("addresses")
      .update({ is_primary: true })
      .eq("id", id);
    
    if (error) {
      toast.error(`Erro ao definir endereço padrão: ${error.message}`);
      fetchData(); // Rollback
    } else {
      toast.success("Endereço padrão atualizado!");
    }
  };

  const handleDeleteAddress = (id: string) => {
    toast("Deseja mesmo excluir o endereço?", {
      description: "Esta ação não poderá ser desfeita.",
      action: {
        label: "Confirmar",
        onClick: async () => {
          const { error } = await supabase
            .from("addresses")
            .delete()
            .eq("id", id);
          
          if (error) {
            toast.error(`Erro ao excluir: ${error.message}`);
          } else {
            setAddresses(prev => prev.filter(a => a.id !== id));
            toast.success("Endereço removido.");
          }
        }
      },
    });
  };

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary selection:text-black">
      <Navbar />
      
      <main className="pt-32 pb-20 px-4 md:px-8 max-w-7xl mx-auto spacetime-grid min-h-screen">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          
          {/* Header Bento Box */}
          <Card className="md:col-span-8 bg-white/[0.02] border-white/5 p-8 rounded-none flex flex-col justify-between group overflow-hidden relative">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <User size={120} />
            </div>
            
            <div className="relative z-10 w-full">
              <div className="flex items-center gap-3 text-[10px] font-display tracking-[0.2em] uppercase mb-6">
                <div className={`px-2 py-0.5 border ${profile?.role === 'admin' ? 'border-primary text-primary bg-primary/5' : 'border-white/10 text-muted-foreground'}`}>
                  {profile?.role === 'admin' ? 'Admin Access' : 'Member'}
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                  Live
                </div>
              </div>
              
              <div className="flex flex-col gap-6">
                {isEditingProfile ? (
                  <div className="space-y-4 max-w-md animate-fade-in">
                    <div className="space-y-1">
                      <label className="text-[10px] font-display text-muted-foreground tracking-widest uppercase">Nome Completo</label>
                      <Input 
                        value={newName}
                        onChange={e => setNewName(e.target.value)}
                        className="bg-secondary/30 border-white/5 rounded-none h-12 h-12 focus:border-white/20 transition-all font-display tracking-widest uppercase"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-display text-muted-foreground tracking-widest uppercase">WhatsApp</label>
                      <Input 
                        value={newPhone}
                        placeholder="+55 (00) 00000-0000"
                        onChange={e => setNewPhone(e.target.value)}
                        className="bg-secondary/30 border-white/5 rounded-none h-12 h-12 focus:border-white/20 transition-all"
                      />
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button onClick={handleUpdateProfile} disabled={savingProfile} className="h-10 bg-white text-black hover:bg-primary font-display text-[10px] tracking-widest uppercase gap-2 flex-1 rounded-none">
                        {savingProfile ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />} Salvar
                      </Button>
                      <Button onClick={() => setIsEditingProfile(false)} variant="ghost" className="h-10 border border-white/10 hover:bg-white/5 font-display text-[10px] tracking-widest uppercase flex-1 rounded-none">
                        Cancelar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="group/name relative inline-block">
                      <h1 className="font-display text-3xl md:text-5xl uppercase tracking-tighter sm:tracking-widest pr-12">
                        {profile?.full_name || "Membro Void"}
                        <button 
                          onClick={() => setIsEditingProfile(true)} 
                          className="absolute right-0 top-1/2 -translate-y-1/2 opacity-0 group-hover/name:opacity-100 p-2 text-primary transition-all hover:scale-110"
                        >
                          <Edit3 size={20} />
                        </button>
                      </h1>
                    </div>
                    
                    <div className="flex flex-wrap gap-6 items-center">
                      <div className="flex items-center gap-3 text-muted-foreground">
                        <User size={14} className="opacity-40" />
                        <span className="text-sm tracking-widest opacity-60 font-medium">{user?.email}</span>
                      </div>
                      
                      <div className="flex items-center gap-3 text-muted-foreground group/whatsapp cursor-pointer" onClick={() => setIsEditingProfile(true)}>
                        <Phone size={14} className="opacity-40" />
                        <span className="text-sm tracking-widest opacity-60 font-medium">
                          {profile?.phone || "Adicionar WhatsApp"}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Stats Box */}
          <Card className="md:col-span-4 bg-white/[0.02] border-white/5 p-8 rounded-none flex flex-col justify-between border-l-primary/30 border-l-2">
            <div className="space-y-6">
              <div className="flex justify-between items-end border-b border-white/5 pb-4">
                <div className="space-y-1">
                  <p className="text-[10px] font-display text-muted-foreground tracking-widest uppercase">Favoritos</p>
                  <p className="text-3xl font-display">{String(wishlistCount).padStart(2, '0')}</p>
                </div>
                <button onClick={() => navigate("/favoritos")} className="p-3 text-muted-foreground hover:text-white border border-white/5 rounded-none hover:bg-white/5 transition-all">
                  <ArrowRight size={20} />
                </button>
              </div>

              <div className="flex justify-between items-end">
                <div className="space-y-1">
                  <p className="text-[10px] font-display text-muted-foreground tracking-widest uppercase">Pedidos</p>
                  <p className="text-3xl font-display">{String(orderCount).padStart(2, '0')}</p>
                </div>
                <button className="p-3 text-muted-foreground hover:text-white border border-white/5 rounded-none hover:bg-white/5 transition-all">
                  <ShoppingBag size={20} />
                </button>
              </div>
            </div>

            <button onClick={signOut} className="mt-8 flex items-center gap-2 text-red-500/60 hover:text-red-500 font-display text-[10px] tracking-widest uppercase transition-colors group px-0">
               <LogOut size={16} /> 
               Sair da Conta 
               <ChevronRight size={14} className="opacity-0 group-hover:translate-x-1 group-hover:opacity-100 transition-all" />
            </button>
          </Card>

          {/* Addresses Bento Box */}
          <Card className="md:col-span-12 bg-white/[0.02] border-white/5 p-8 rounded-none">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
              <div className="space-y-1">
                <h2 className="font-display text-2xl tracking-widest uppercase">Endereços</h2>
                <p className="text-muted-foreground text-[10px] tracking-widest uppercase">Gerencie seus Locais de Entrega</p>
              </div>
              <Button 
                onClick={() => setShowAddressForm(true)}
                className="bg-white text-black hover:bg-primary transition-all rounded-none h-12 px-6 font-display text-[10px] tracking-widest uppercase gap-2"
              >
                <Plus size={16} /> Novo Local
              </Button>
            </div>

            {addresses.length === 0 ? (
              <div className="border border-dashed border-white/10 p-12 text-center flex flex-col items-center gap-4">
                <MapPin size={40} className="text-muted-foreground opacity-20" />
                <p className="font-display text-[10px] text-muted-foreground tracking-widest uppercase">Nenhum endereço cadastrado</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {addresses.map((addr) => (
                  <motion.div
                    key={addr.id}
                    layout
                    className={`relative p-6 border transition-all duration-300 group ${
                      addr.is_primary 
                        ? 'bg-white/[0.04] border-primary/40 shadow-[0_0_20px_rgba(255,255,255,0.03)]' 
                        : 'bg-white/[0.01] border-white/5 hover:border-white/20'
                    }`}
                  >
                    {addr.is_primary && (
                      <div className="absolute top-0 right-0 px-2 py-0.5 bg-primary text-black font-display text-[8px] tracking-widest uppercase font-bold">
                        Padrão
                      </div>
                    )}
                    
                    <div className="flex justify-between items-start mb-4">
                      <div 
                        onClick={() => handleSetPrimary(addr.id)}
                        className={`p-2 cursor-pointer transition-all ${
                          addr.is_primary ? 'text-[#FFFD00] scale-110' : 'text-muted-foreground hover:text-white'
                        }`}
                      >
                        <Star size={20} fill={addr.is_primary ? "currentColor" : "none"} />
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => { setEditingAddress(addr); setShowAddressForm(true); }}
                          className="p-2 text-muted-foreground hover:text-white transition-colors"
                        >
                          <Edit3 size={16} />
                        </button>
                        <button 
                          onClick={() => handleDeleteAddress(addr.id)}
                          className="p-2 text-muted-foreground hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <p className="font-display text-[11px] tracking-widest uppercase text-foreground">{addr.full_name}</p>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {addr.street}, {addr.number} {addr.complement && `— ${addr.complement}`}
                      </p>
                      <p className="text-sm text-muted-foreground pb-2">
                        {addr.neighborhood}, {addr.city} - {addr.state}
                      </p>
                      <p className="text-[10px] font-display text-primary tracking-widest">{addr.zip_code}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </main>

      <AnimatePresence>
        {showAddressForm && (
          <AddressForm 
            editingAddress={editingAddress}
            profile={profile}
            user={user}
            addresses={addresses}
            onClose={() => { setShowAddressForm(false); setEditingAddress(null); }}
            onSuccess={() => {
              setShowAddressForm(false);
              setEditingAddress(null);
              fetchData();
            }}
          />
        )}
      </AnimatePresence>
      <Footer />
    </div>
  );
};

export default Profile;
