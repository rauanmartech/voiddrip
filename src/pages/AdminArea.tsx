import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CosmicElements from "@/components/CosmicElements";
import { 
  PlusCircle, 
  BarChart, 
  Settings, 
  LogOut, 
  Star, 
  List, 
  Edit3, 
  Trash2, 
  Package, 
  Users, 
  ShoppingBag, 
  ChevronRight,
  LayoutDashboard,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS as PRODUCT_KEYS } from "@/hooks/useProducts";
import { useAdminOrders, QUERY_KEYS as ORDER_KEYS } from "@/hooks/useOrders";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

const ADMIN_EMAIL = "rauanrocha.martech@gmail.com";

const AdminArea = () => {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "products" | "list" | "orders" | "settings">("overview");
  
  const { data: allOrders, isLoading: loadingOrders } = useAdminOrders();

  // Product management states
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [productList, setProductList] = useState<any[]>([]);
  const [loadingList, setLoadingList] = useState(false);

  // Form states
  const [prodName, setProdName] = useState("");
  const [prodDesc, setProdDesc] = useState("");
  const [prodCategory, setProdCategory] = useState("Camisetas");
  const [prodPrice, setProdPrice] = useState("");
  const [prodSizes, setProdSizes] = useState("");
  const [prodColors, setProdColors] = useState("");
  const [prodStock, setProdStock] = useState("0");
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [coverImageIndex, setCoverImageIndex] = useState(0);
  const [coverImageSource, setCoverImageSource] = useState<"existing" | "new">("existing");

  const [newPassword, setNewPassword] = useState("");
  const [passMessage, setPassMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
      if (session?.user?.email === ADMIN_EMAIL) {
        fetchProducts();
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user?.email === ADMIN_EMAIL) {
        fetchProducts();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProducts = async () => {
    setLoadingList(true);
    const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    if (data) setProductList(data);
    setLoadingList(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const openAddProduct = () => {
    setIsEditing(false);
    setEditingId(null);
    setProdName("");
    setProdDesc("");
    setProdCategory("Camisetas");
    setProdPrice("");
    setProdSizes("");
    setProdColors("");
    setProdStock("0");
    setImageFiles([]);
    setExistingImages([]);
    setCoverImageIndex(0);
    setCoverImageSource("new");
    setError(null);
    setSuccess(null);
    setActiveTab("products");
  };

  const openEditProduct = (product: any) => {
    setIsEditing(true);
    setEditingId(product.id);
    setProdName(product.name);
    setProdDesc(product.description || "");
    setProdCategory(product.category);
    setProdPrice(product.price.toString());
    setProdSizes(product.sizes?.join(", ") || "");
    setProdColors(product.colors?.join(", ") || "");
    setProdStock(product.stock_quantity.toString());
    setImageFiles([]);
    setExistingImages(product.image_url ? product.image_url.split(',') : []);
    setCoverImageIndex(0);
    setCoverImageSource("existing");
    setError(null);
    setSuccess(null);
    setActiveTab("products");
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    let finalUrls: string[] = [];
    if (imageFiles.length > 0) {
      for (const file of imageFiles) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('produtos').upload(fileName, file);
        if (uploadError) {
          setError("Erro no upload: " + uploadError.message);
          setSaving(false);
          return;
        }
        const { data: publicUrlData } = supabase.storage.from('produtos').getPublicUrl(fileName);
        finalUrls.push(publicUrlData.publicUrl);
      }
    }

    let resultList = [...existingImages, ...finalUrls];
    let coverUrl = "";
    if (coverImageSource === "existing" && coverImageIndex < existingImages.length) coverUrl = existingImages[coverImageIndex];
    else if (coverImageSource === "new" && coverImageIndex < finalUrls.length) coverUrl = finalUrls[coverImageIndex];

    if (coverUrl) resultList = [coverUrl, ...resultList.filter(u => u !== coverUrl)];

    const productData = {
      name: prodName,
      description: prodDesc || null,
      category: prodCategory,
      price: parseFloat(prodPrice),
      sizes: prodSizes.split(",").map(s => s.trim()).filter(s => s) || null,
      colors: prodColors.split(",").map(c => c.trim()).filter(c => c) || null,
      stock_quantity: parseInt(prodStock, 10),
      image_url: resultList.join(',') || null
    };

    // --- OPTIMISTIC UPDATE FOR SAVE ---
    const previousList = [...productList];
    if (isEditing && editingId) {
      setProductList(prev => prev.map(p => p.id === editingId ? { ...p, ...productData } : p));
    } else {
      const tempId = 'temp-' + Date.now();
      setProductList(prev => [{ id: tempId, ...productData, created_at: new Date().toISOString() }, ...prev]);
    }

    let result;
    if (isEditing && editingId) result = await supabase.from('products').update(productData).eq('id', editingId);
    else result = await supabase.from('products').insert(productData);

    setSaving(false);
    if (result.error) {
      setProductList(previousList); // Rollback
      setError("Erro: " + result.error.message);
      toast.error("Falha ao salvar produto");
    } else {
      setSuccess("Salvo com sucesso!");
      toast.success("Catálogo atualizado");
      queryClient.invalidateQueries({ queryKey: PRODUCT_KEYS.products });
      setTimeout(() => { setActiveTab("list"); fetchProducts(); }, 1500);
    }
  };

  const deleteProduct = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir permanentemente este produto?")) return;
    
    // --- OPTIMISTIC UPDATE FOR DELETE ---
    const previousList = [...productList];
    setProductList(prev => prev.filter(p => p.id !== id));
    toast.message("Excluindo produto...");

    const { error } = await supabase.from('products').delete().eq('id', id);
    
    if (error) {
      setProductList(previousList); // Rollback
      toast.error("Erro ao excluir: Produto possivelmente vinculado a pedidos.");
      console.error(error);
    } else {
      toast.success("Produto removido do sistema");
      queryClient.invalidateQueries({ queryKey: PRODUCT_KEYS.products });
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    const { error } = await supabase.from('orders').update({ status: newStatus }).eq('id', orderId);
    if (error) toast.error("Erro ao atualizar status");
    else {
      toast.success("Pedido atualizado");
      queryClient.invalidateQueries({ queryKey: ORDER_KEYS.adminOrders });
    }
  };

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center"><div className="w-8 h-8 border-y border-primary rounded-full animate-spin" /></div>;

  const isAdmin = session?.user?.email === ADMIN_EMAIL;
  if (!session || !isAdmin) return (
    <div className="min-h-screen bg-background flex flex-col uppercase font-display">
      <Navbar />
      <main className="flex-1 flex items-center justify-center relative spacetime-grid">
        <CosmicElements />
        <div className="product-card p-10 bg-card/40 backdrop-blur-xl border-red-500/20 text-center relative z-10">
          <h1 className="text-2xl text-red-500 tracking-[0.3em] mb-4">ACESSO NEGADO</h1>
          <button onClick={() => navigate("/")} className="btn-explore w-full py-4">VOLTAR PARA SEGURANÇA</button>
        </div>
      </main>
      <Footer />
    </div>
  );

  const totalRevenue = allOrders?.reduce((acc, o) => o.status === 'completed' || o.status === 'paid' ? acc + o.total_amount : acc, 0) || 0;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-display uppercase selection:bg-primary selection:text-black">
      <Navbar />
      <main className="flex-1 pt-24 pb-12 flex relative overflow-hidden">
        <CosmicElements />
        <div className="container mx-auto px-6 flex flex-col md:flex-row gap-8 relative z-10">
          
          {/* Sidebar */}
          <aside className="w-full md:w-64 flex flex-col gap-2">
            <div className="p-4 bg-card/40 backdrop-blur-md border border-white/5 mb-4">
              <span className="text-[10px] tracking-[0.3em] text-primary flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" /> VOID_ADM ONLINE
              </span>
              <p className="text-[9px] text-muted-foreground truncate mt-1">{session.user.email}</p>
            </div>

            <nav className="flex flex-col gap-1">
              <SidebarItem icon={<LayoutDashboard size={16} />} label="VISÃO GERAL" active={activeTab === "overview"} onClick={() => setActiveTab("overview")} />
              <SidebarItem icon={<ShoppingBag size={16} />} label="VENDAS" active={activeTab === "orders"} onClick={() => setActiveTab("orders")} />
              <SidebarItem icon={<List size={16} />} label="ESTOQUE" active={activeTab === "list"} onClick={() => { setActiveTab("list"); fetchProducts(); }} />
              <SidebarItem icon={<PlusCircle size={16} />} label="NOVO PRODUTO" active={activeTab === "products"} onClick={openAddProduct} />
              <SidebarItem icon={<Settings size={16} />} label="CONTA" active={activeTab === "settings"} onClick={() => setActiveTab("settings")} />
              <button onClick={handleLogout} className="flex items-center gap-4 px-4 py-3 text-[10px] tracking-[0.3em] text-muted-foreground hover:text-red-500 hover:bg-red-500/5 transition-all mt-4"><LogOut size={16}/><span>LOGOUT</span></button>
            </nav>
          </aside>

          {/* Content */}
          <section className="flex-1 bg-card/20 backdrop-blur-sm border border-white/5 p-8 relative overflow-hidden">
            <AnimatePresence mode="wait">
              {activeTab === "overview" && (
                <motion.div key="ov" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                  <header><h2 className="text-2xl tracking-[0.4em] mb-2">DASHBOARD</h2><p className="text-[10px] text-muted-foreground tracking-[0.2em]">STATUS DO SISTEMA</p></header>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <StatCard icon={<ShoppingBag className="text-primary"/>} label="RECEITA TOTAL" value={`R$ ${totalRevenue.toFixed(2)}`} />
                    <StatCard icon={<Package className="text-primary"/>} label="PRODUTOS" value={productList.length.toString()} />
                    <StatCard icon={<Users className="text-primary"/>} label="PEDIDOS TOTAIS" value={allOrders?.length.toString() || "0"} />
                  </div>
                </motion.div>
              )}

              {activeTab === "orders" && (
                <motion.div key="ord" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                  <header><h2 className="text-2xl tracking-[0.4em] mb-2">PEDIDOS</h2><p className="text-[10px] text-muted-foreground tracking-[0.2em]">GESTÃO DE VENDAS E PAGAMENTOS</p></header>
                  
                  {loadingOrders ? <div className="py-20 flex justify-center"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div> : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-white/5 text-[10px] tracking-[0.3em] text-muted-foreground">
                            <th className="py-4 px-2">CLIENTE / ID</th>
                            <th className="py-4 px-2">VALOR</th>
                            <th className="py-4 px-2">STATUS</th>
                            <th className="py-4 px-2">MERCADO PAGO</th>
                            <th className="py-4 px-2 text-right">GESTÃO</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {allOrders?.map((o) => (
                            <tr key={o.id} className="text-[10px] hover:bg-white/[0.02]">
                              <td className="py-4 px-2">
                                <p className="font-bold tracking-widest">{o.full_name || 'GUEST'}</p>
                                <p className="text-muted-foreground text-[8px] mt-1 italic">{o.email}</p>
                                <p className="text-[7px] text-muted-foreground">#{o.id.slice(0,8)}</p>
                                {o.addresses && o.addresses[0] && (
                                  <div className="mt-2 text-[7px] text-primary/40 border-l border-primary/20 pl-2">
                                    {o.addresses[0].street}, {o.addresses[0].number}
                                    <br />{o.addresses[0].city} - {o.addresses[0].state}
                                  </div>
                                )}
                              </td>
                              <td className="py-4 px-2 text-[11px]">R$ {o.total_amount.toFixed(2)}</td>
                              <td className="py-4 px-2">
                                <span className={`px-2 py-1 border ${o.status === 'completed' || o.status === 'paid' ? 'border-primary text-primary' : o.status === 'pending' ? 'border-yellow-500 text-yellow-500' : 'border-red-500 text-red-500'}`}>
                                  {o.status.toUpperCase()}
                                </span>
                              </td>
                              <td className="py-4 px-2">
                                {o.mercado_pago_order_id ? (
                                  <div className="flex flex-col gap-1">
                                    <span className="text-[8px] text-muted-foreground">ID: {o.mercado_pago_order_id}</span>
                                    {o.payment_status_detail && <span className="text-[7px] text-primary/50">{o.payment_status_detail}</span>}
                                  </div>
                                ) : 'N/A'}
                              </td>
                              <td className="py-4 px-2 text-right">
                                <select 
                                  value={o.status} 
                                  onChange={(e) => updateOrderStatus(o.id, e.target.value)}
                                  className="bg-black/40 border border-white/10 text-[9px] px-2 py-1 focus:outline-none focus:border-primary"
                                >
                                  <option value="pending">PENDENTE</option>
                                  <option value="paid">PAGO</option>
                                  <option value="completed">CONCLUÍDO</option>
                                  <option value="canceled">CANCELADO</option>
                                </select>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === "list" && (
                <motion.div key="li" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                  <header className="flex justify-between items-end">
                    <div><h2 className="text-2xl tracking-[0.4em] mb-2">ESTOQUE</h2><p className="text-[10px] text-muted-foreground tracking-[0.2em]">PRODUTOS CADASTRADOS</p></div>
                    <button onClick={openAddProduct} className="text-[10px] text-primary hover:underline"> + NOVO ITEM</button>
                  </header>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead><tr className="border-b border-white/5 text-[10px] tracking-[0.3em] text-muted-foreground"><th className="py-4">PRODUTO</th><th className="py-4">PREÇO</th><th className="py-4">ESTOQUE</th><th className="py-4 text-right">AÇÕES</th></tr></thead>
                      <tbody className="divide-y divide-white/5">
                        {productList.map(p => (
                          <tr key={p.id} className="hover:bg-white/[0.02]">
                            <td className="py-4 flex items-center gap-3">
                              <div className="w-10 h-10 bg-secondary border border-border overflow-hidden">{p.image_url && <img src={p.image_url.split(',')[0]} className="w-full h-full object-cover grayscale"/>}</div>
                              <span className="text-[10px] tracking-widest">{p.name}</span>
                            </td>
                            <td className="py-4 text-[10px]">R$ {p.price.toFixed(2)}</td>
                            <td className="py-4 text-[10px]">{p.stock_quantity}</td>
                            <td className="py-4 text-right flex justify-end gap-2 pr-2">
                              <button onClick={() => openEditProduct(p)} className="p-2 text-muted-foreground hover:text-primary"><Edit3 size={14}/></button>
                              <button onClick={() => deleteProduct(p.id)} className="p-2 text-muted-foreground hover:text-red-500"><Trash2 size={14}/></button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              )}

              {activeTab === "products" && (
                <motion.div key="pr" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl">
                  <header className="mb-8"><h2 className="text-2xl tracking-[0.4em] mb-2">{isEditing ? "EDITAR" : "NOVO"} PRODUTO</h2></header>
                  <form onSubmit={handleSaveProduct} className="grid grid-cols-1 md:grid-cols-2 gap-6 text-[10px] tracking-widest text-left">
                    <div className="md:col-span-2 flex flex-col gap-2">
                      <label>NOME</label>
                      <input required value={prodName} onChange={e=>setProdName(e.target.value)} className="bg-black/40 border border-white/10 px-4 py-3"/>
                    </div>
                    <div className="md:col-span-2 flex flex-col gap-2">
                      <label>DESCRIÇÃO</label>
                      <textarea rows={3} value={prodDesc} onChange={e=>setProdDesc(e.target.value)} className="bg-black/40 border border-white/10 px-4 py-3 resize-none"/>
                    </div>
                    <div className="flex flex-col gap-2"><label>CATEGORIA</label><select value={prodCategory} onChange={e=>setProdCategory(e.target.value)} className="bg-black/40 border border-white/10 px-4 py-3"><option value="Camisetas">Camisetas</option><option value="Moletons">Moletons</option><option value="Calças">Calças</option><option value="Acessórios">Acessórios</option></select></div>
                    <div className="flex flex-col gap-2"><label>PREÇO</label><input type="number" step="0.01" required value={prodPrice} onChange={e=>setProdPrice(e.target.value)} className="bg-black/40 border border-white/10 px-4 py-3"/></div>
                    <div className="md:col-span-2 flex flex-col gap-2"><label>IMAGENS (MÁX 9)</label><input type="file" multiple accept="image/*" onChange={handleImageChange} className="bg-black/40 border border-white/10 px-4 py-3"/></div>
                    
                    <div className="md:col-span-2 flex gap-4 mt-6">
                      <button type="submit" disabled={saving} className="btn-explore flex-1 py-4">{saving ? "SALVANDO..." : "CONFIRMAR"}</button>
                      <button type="button" onClick={() => setActiveTab("list")} className="px-6 border border-white/10">CANCELAR</button>
                    </div>
                  </form>
                </motion.div>
              )}

              {activeTab === "settings" && (
                <motion.div key="se" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-md">
                   <header className="mb-8"><h2 className="text-2xl tracking-[0.4em] mb-2">CONFIGURAÇÕES</h2></header>
                   <form onSubmit={handleUpdatePassword} className="space-y-6">
                    <div className="flex flex-col gap-2"><label className="text-[10px]">NOVA SENHA</label><input type="password" required value={newPassword} onChange={e=>setNewPassword(e.target.value)} className="bg-black/40 border border-white/10 px-4 py-3"/></div>
                    <button type="submit" className="btn-explore w-full py-4">ATUALIZAR SENHA</button>
                    {passMessage && <p className="text-[10px] mt-4 text-primary">{passMessage}</p>}
                  </form>
                </motion.div>
              )}

            </AnimatePresence>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
};

const SidebarItem = ({ icon, label, active, onClick }: any) => (
  <button onClick={onClick} className={`flex items-center gap-4 px-4 py-3 text-[10px] tracking-[0.3em] transition-all rounded-sm relative overflow-hidden ${active ? 'text-primary bg-primary/5' : 'text-muted-foreground hover:text-foreground hover:bg-white/5'}`}>
    {active && <motion.div layoutId="adm-side" className="absolute left-0 top-0 bottom-0 w-[2px] bg-primary" />}
    {icon} <span>{label}</span>
  </button>
);

const StatCard = ({ icon, label, value }: any) => (
  <div className="bg-card/40 backdrop-blur-md border border-white/5 p-6 space-y-2 group hover:border-primary/20 transition-all">
    <div className="flex justify-between items-start"><div className="p-2 bg-white/5 rounded-sm">{icon}</div><div className="text-[8px] tracking-[0.4em] text-muted-foreground">REAL-TIME</div></div>
    <div><h4 className="text-[9px] text-muted-foreground">{label}</h4><p className="text-xl text-foreground font-display">{value}</p></div>
  </div>
);

export default AdminArea;
