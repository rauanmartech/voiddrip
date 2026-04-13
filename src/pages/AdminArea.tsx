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
  AlertCircle,
  Ticket,
  MessageSquare,
  Percent,
  DollarSign,
  Tag,
  PieChart as PieChartIcon
} from "lucide-react";
import { 
  BarChart as ReBarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip as ReTooltip, 
  ResponsiveContainer, 
  PieChart as RePieChart, 
  Pie, 
  Cell,
  Legend
} from 'recharts';
import { useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS as PRODUCT_KEYS } from "@/hooks/useProducts";
import { useAdminOrders, QUERY_KEYS as ORDER_KEYS } from "@/hooks/useOrders";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

const ADMIN_EMAIL = "rauanrocha.martech@gmail.com";

const AdminArea = () => {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "products" | "list" | "orders" | "settings" | "feedback" | "coupons">("overview");
  
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
  
  // Feedback and Coupons states
  const [feedbackList, setFeedbackList] = useState<any[]>([]);
  const [loadingFeedback, setLoadingFeedback] = useState(false);
  const [couponsList, setCouponsList] = useState<any[]>([]);
  const [loadingCoupons, setLoadingCoupons] = useState(false);
  const [showCouponForm, setShowCouponForm] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<any>(null);

  // Coupon form states
  const [couponCode, setCouponCode] = useState("");
  const [discountType, setDiscountType] = useState<"percentage" | "fixed">("percentage");
  const [discountValue, setDiscountValue] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [couponActive, setCouponActive] = useState(true);

  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
      if (session?.user?.email === ADMIN_EMAIL) {
        fetchProducts();
        fetchFeedback();
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user?.email === ADMIN_EMAIL) {
        fetchProducts();
        if (activeTab === "overview") {
          fetchFeedback();
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [activeTab]);

  const fetchFeedback = async () => {
    setLoadingFeedback(true);
    const { data } = await supabase.from('pre_drop_feedback').select('*').order('created_at', { ascending: false });
    if (data) setFeedbackList(data);
    setLoadingFeedback(false);
  };

  const fetchCoupons = async () => {
    setLoadingCoupons(true);
    const { data } = await supabase.from('coupons').select('*').order('created_at', { ascending: false });
    if (data) setCouponsList(data);
    setLoadingCoupons(false);
  };

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

  // Coupon management functions
  const handleSaveCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const data = {
        code: couponCode.toUpperCase(),
        discount_type: discountType,
        discount_value: parseFloat(discountValue),
        expires_at: expiresAt || null,
        active: couponActive,
        created_by: session.user.email
      };
      let res;
      if (editingCoupon) res = await supabase.from('coupons').update(data).eq('id', editingCoupon.id);
      else res = await supabase.from('coupons').insert(data);
      if (res.error) throw res.error;
      toast.success(editingCoupon ? "Cupom atualizado" : "Cupom criado");
      setShowCouponForm(false);
      resetCouponForm();
      fetchCoupons();
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  const deleteCoupon = async (id: string) => {
    if (!confirm("Excluir cupom?")) return;
    const { error } = await supabase.from('coupons').delete().eq('id', id);
    if (error) toast.error("Erro ao excluir");
    else { toast.success("Cupom removido"); fetchCoupons(); }
  };

  const toggleCoupon = async (coupon: any) => {
    const { error } = await supabase.from('coupons').update({ active: !coupon.active }).eq('id', coupon.id);
    if (error) toast.error("Erro");
    else fetchCoupons();
  };

  const resetCouponForm = () => {
    setCouponCode("");
    setDiscountType("percentage");
    setDiscountValue("");
    setExpiresAt("");
    setCouponActive(true);
    setEditingCoupon(null);
  };

  const openEditCoupon = (coupon: any) => {
    setEditingCoupon(coupon);
    setCouponCode(coupon.code);
    setDiscountType(coupon.discount_type);
    setDiscountValue(coupon.discount_value.toString());
    setExpiresAt(coupon.expires_at ? coupon.expires_at.slice(0,16) : "");
    setCouponActive(coupon.active);
    setShowCouponForm(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      if (files.length + existingImages.length > 9) {
        toast.error("Máximo de 9 imagens permitidas");
        return;
      }
      setImageFiles(prev => [...prev, ...files]);
      setCoverImageIndex(0);
      setCoverImageSource("new");
    }
  };

  const removeImage = (index: number, type: "existing" | "new") => {
    if (type === "existing") {
      setExistingImages(prev => prev.filter((_, i) => i !== index));
      if (coverImageSource === "existing" && coverImageIndex === index) {
        setCoverImageIndex(0);
      }
    } else {
      setImageFiles(prev => prev.filter((_, i) => i !== index));
      if (coverImageSource === "new" && coverImageIndex === index) {
        setCoverImageIndex(0);
        setCoverImageSource("existing");
      }
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassMessage(null);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) setPassMessage("Erro: " + error.message);
    else {
      setPassMessage("Senha atualizada com sucesso!");
      setNewPassword("");
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
              <SidebarItem icon={<Ticket size={16} />} label="CUPONS" active={activeTab === "coupons"} onClick={() => { setActiveTab("coupons"); fetchCoupons(); }} />
              <SidebarItem icon={<MessageSquare size={16} />} label="FEEDBACK" active={activeTab === "feedback"} onClick={() => { setActiveTab("feedback"); fetchFeedback(); }} />
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

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-12">
                    {/* Vibe Chart */}
                    <div className="bg-card/40 backdrop-blur-md border border-white/5 p-6 space-y-4">
                      <header className="flex justify-between items-center">
                        <h3 className="text-[10px] tracking-[0.3em] text-primary">DISTRIBUIÇÃO DE VIBE</h3>
                        <PieChartIcon size={14} className="text-muted-foreground" />
                      </header>
                      <div className="h-[250px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <RePieChart>
                            <Pie
                              data={Object.entries(feedbackList.reduce((acc: any, f) => { 
                                const val = f.vibe || "N/A";
                                acc[val] = (acc[val] || 0) + 1; 
                                return acc; 
                              }, {})).map(([name, value]) => ({ name, value }))}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={80}
                              paddingAngle={5}
                              dataKey="value"
                            >
                              {Object.entries(feedbackList.reduce((acc: any, f) => { acc[f.vibe || "N/A"] = (acc[f.vibe || "N/A"] || 0) + 1; return acc; }, {})).map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={["#00f2ff", "#7000ff", "#ff007a", "#ffea00", "#00ff95", "#ffffff"][index % 6]} />
                              ))}
                            </Pie>
                            <ReTooltip 
                              contentStyle={{ backgroundColor: '#000', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0', fontSize: '10px' }}
                              itemStyle={{ color: '#fff' }}
                            />
                            <Legend wrapperStyle={{ fontSize: '9px', paddingTop: '20px' }} />
                          </RePieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Decision Factors Chart */}
                    <div className="bg-card/40 backdrop-blur-md border border-white/5 p-6 space-y-4">
                      <header className="flex justify-between items-center">
                        <h3 className="text-[10px] tracking-[0.3em] text-primary">FATORES DE DECISÃO</h3>
                        <BarChart size={14} className="text-muted-foreground" />
                      </header>
                      <div className="h-[250px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <ReBarChart
                            layout="vertical"
                            data={Object.entries(feedbackList.reduce((acc: any, f) => { 
                              const val = (f.decision_factor || "N/A").toUpperCase();
                              acc[val] = (acc[val] || 0) + 1; 
                              return acc; 
                            }, {})).map(([name, value]) => ({ name, value })).sort((a: any, b: any) => b.value - a.value)}
                            margin={{ left: 40, right: 20 }}
                          >
                            <XAxis type="number" hide />
                            <YAxis 
                              dataKey="name" 
                              type="category" 
                              axisLine={false} 
                              tickLine={false} 
                              tick={{ fill: '#888', fontSize: 8 }}
                              width={80}
                            />
                            <ReTooltip 
                              cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                              contentStyle={{ backgroundColor: '#000', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0', fontSize: '10px' }}
                            />
                            <Bar dataKey="value" radius={[0, 2, 2, 0]}>
                              {Object.entries(feedbackList.reduce((acc: any, f) => { const v = (f.decision_factor || "N/A").toUpperCase(); acc[v] = (acc[v] || 0) + 1; return acc; }, {})).map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={["#7000ff", "#ff007a", "#00f2ff"][index % 3]} />
                              ))}
                            </Bar>
                          </ReBarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Desired Items Chart */}
                    <div className="bg-card/40 backdrop-blur-md border border-white/5 p-6 space-y-4 lg:col-span-2">
                       <header className="flex justify-between items-center">
                        <h3 className="text-[10px] tracking-[0.3em] text-primary">ITENS MAIS DESEJADOS</h3>
                        <Package size={14} className="text-muted-foreground" />
                      </header>
                      <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <ReBarChart 
                            data={Object.entries((feedbackList || []).flatMap(f => f.items || []).reduce((acc: any, i) => { 
                              const label = i.replace(/_/g, ' ').toUpperCase(); 
                              acc[label] = (acc[label] || 0) + 1; 
                              return acc; 
                            }, {})).map(([name, value]) => ({ name, value })).sort((a: any, b: any) => b.value - a.value).slice(0, 8)}
                            margin={{ top: 20, right: 30, left: 0, bottom: 60 }}
                          >
                            <XAxis 
                              dataKey="name" 
                              axisLine={{ stroke: 'rgba(255,255,255,0.05)' }} 
                              tickLine={false} 
                              tick={{ fill: '#888', fontSize: 8 }}
                              interval={0}
                              angle={-45}
                              textAnchor="end"
                              height={60}
                            />
                            <YAxis 
                              axisLine={false} 
                              tickLine={false} 
                              tick={{ fill: '#888', fontSize: 8 }}
                            />
                            <ReTooltip 
                              cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                              contentStyle={{ backgroundColor: '#000', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0', fontSize: '10px' }}
                            />
                            <Bar dataKey="value" fill="#00f2ff" radius={[2, 2, 0, 0]} />
                          </ReBarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
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
                    <div className="flex flex-col gap-2"><label>ESTOQUE</label><input type="number" required value={prodStock} onChange={e=>setProdStock(e.target.value)} className="bg-black/40 border border-white/10 px-4 py-3"/></div>
                    
                    <div className="flex flex-col gap-2"><label>TAMANHOS (P,M,G...)</label><input value={prodSizes} onChange={e=>setProdSizes(e.target.value)} className="bg-black/40 border border-white/10 px-4 py-3" placeholder="P, M, G, GG"/></div>
                    <div className="flex flex-col gap-2"><label>CORES (PRETO,BRANCO...)</label><input value={prodColors} onChange={e=>setProdColors(e.target.value)} className="bg-black/40 border border-white/10 px-4 py-3" placeholder="Preto, Branco"/></div>
                    
                    <div className="md:col-span-2 flex flex-col gap-2">
                      <label>IMAGENS (MÁX 9 TOTAL) - ESTRELA PARA CAPA</label>
                      <input type="file" multiple accept="image/*" onChange={handleImageChange} className="bg-black/40 border border-white/10 px-4 py-3"/>
                      
                      <div className="grid grid-cols-5 gap-2 mt-2">
                        {existingImages.map((url, idx) => (
                          <div key={`exist-${idx}`} className="relative aspect-square border border-white/5 bg-white/5 group/img">
                            <img src={url} className="w-full h-full object-cover" />
                            <button 
                              type="button" 
                              onClick={() => { setCoverImageIndex(idx); setCoverImageSource("existing"); }} 
                              className={`absolute top-1 left-1 p-1 rounded-full backdrop-blur-md transition-colors ${coverImageSource === "existing" && coverImageIndex === idx ? 'bg-primary text-black' : 'bg-black/50 text-white/50'}`}
                            >
                              <Star size={8} fill={coverImageSource === "existing" && coverImageIndex === idx ? "currentColor" : "none"} />
                            </button>
                            <button type="button" onClick={() => removeImage(idx, "existing")} className="absolute top-1 right-1 p-1 bg-red-500/80 text-white rounded-full opacity-0 group-hover/img:opacity-100 transition-opacity">
                              <LogOut size={8} className="rotate-90" />
                            </button>
                          </div>
                        ))}
                        {imageFiles.map((file, idx) => (
                          <div key={`new-${idx}`} className="relative aspect-square border border-white/5 bg-white/5 group/img">
                            <img src={URL.createObjectURL(file)} className="w-full h-full object-cover" />
                            <button 
                              type="button" 
                              onClick={() => { setCoverImageIndex(idx); setCoverImageSource("new"); }} 
                              className={`absolute top-1 left-1 p-1 rounded-full backdrop-blur-md transition-colors ${coverImageSource === "new" && coverImageIndex === idx ? 'bg-primary text-black' : 'bg-black/50 text-white/50'}`}
                            >
                              <Star size={8} fill={coverImageSource === "new" && coverImageIndex === idx ? "currentColor" : "none"} />
                            </button>
                            <button type="button" onClick={() => removeImage(idx, "new")} className="absolute top-1 right-1 p-1 bg-red-500/80 text-white rounded-full opacity-0 group-hover/img:opacity-100 transition-opacity">
                              <LogOut size={8} className="rotate-90" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                    
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

              {activeTab === "feedback" && (
                <motion.div key="fb" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                  <header><h2 className="text-2xl tracking-[0.4em] mb-2">FEEDBACK PRÉ-DROP</h2><p className="text-[10px] text-muted-foreground tracking-[0.2em]">RESULTADOS DA PESQUISA DE VIBE</p></header>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <StatCard icon={<MessageSquare className="text-primary"/>} label="TOTAL RESPOSTAS" value={feedbackList.length.toString()} />
                    <StatCard 
                      icon={<Star className="text-primary"/>} 
                      label="VIBE DOMINANTE" 
                      value={feedbackList.length > 0 ? Object.entries(feedbackList.reduce((acc: any, f) => { acc[f.vibe] = (acc[f.vibe] || 0) + 1; return acc; }, {})).sort((a: any, b: any) => b[1] - a[1])[0][0] : "N/A"} 
                    />
                    <StatCard 
                      icon={<CheckCircle2 className="text-primary"/>} 
                      label="ITENS MAIS DESEJADOS" 
                      value={feedbackList.length > 0 ? Object.entries(feedbackList.flatMap(f => f.items).reduce((acc: any, i) => { acc[i] = (acc[i] || 0) + 1; return acc; }, {})).sort((a: any, b: any) => b[1] - a[1])[0][0]?.replace('_', ' ').toUpperCase() : "N/A"} 
                    />
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-white/5 text-[10px] tracking-[0.3em] text-muted-foreground">
                          <th className="py-4 px-2">DATA</th>
                          <th className="py-4 px-2">VIBE</th>
                          <th className="py-4 px-2">ITENS</th>
                          <th className="py-4 px-2">FATOR DECISÃO</th>
                          <th className="py-4 px-2">DESCRIÇÃO</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {feedbackList.map((f) => (
                          <tr key={f.id} className="text-[9px] hover:bg-white/[0.02] items-start">
                            <td className="py-4 px-2 text-muted-foreground">{new Date(f.created_at).toLocaleDateString()}</td>
                            <td className="py-4 px-2 font-bold tracking-widest text-primary">{f.vibe}</td>
                            <td className="py-4 px-2 max-w-xs"><div className="flex flex-wrap gap-1">{f.items.map((i: string) => <span key={i} className="px-1 bg-white/5 border border-white/10 uppercase">{i.replace('_', ' ')}</span>)}</div></td>
                            <td className="py-4 px-2 uppercase">{f.decision_factor}</td>
                            <td className="py-4 px-2 text-muted-foreground italic max-w-sm truncate" title={f.perfect_brand_description}>{f.perfect_brand_description || "-"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              )}

              {activeTab === "coupons" && (
                <motion.div key="cp" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                  <header className="flex justify-between items-end">
                    <div><h2 className="text-2xl tracking-[0.4em] mb-2">CUPONS</h2><p className="text-[10px] text-muted-foreground tracking-[0.2em]">GESTÃO DE DESCONTOS</p></div>
                    <button onClick={() => { resetCouponForm(); setShowCouponForm(true); }} className="text-[10px] text-primary hover:underline"> + NOVO CUPOM</button>
                  </header>

                  {showCouponForm && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="p-6 border border-primary/20 bg-primary/5 space-y-4">
                      <form onSubmit={handleSaveCoupon} className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[10px] tracking-widest">
                        <div className="flex flex-col gap-2"><label>CÓDIGO</label><input required value={couponCode} onChange={e=>setCouponCode(e.target.value)} className="bg-black/40 border border-white/10 px-3 py-2 uppercase"/></div>
                        <div className="flex flex-col gap-2">
                          <label>TIPO</label>
                          <div className="flex gap-2">
                            <button type="button" onClick={()=>setDiscountType("percentage")} className={`flex-1 py-2 border ${discountType === "percentage" ? "border-primary text-primary" : "border-white/10"}`}>%</button>
                            <button type="button" onClick={()=>setDiscountType("fixed")} className={`flex-1 py-2 border ${discountType === "fixed" ? "border-primary text-primary" : "border-white/10"}`}>R$</button>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2"><label>VALOR</label><input type="number" step="0.01" required value={discountValue} onChange={e=>setDiscountValue(e.target.value)} className="bg-black/40 border border-white/10 px-3 py-2"/></div>
                        <div className="flex flex-col gap-2"><label>EXPIRAÇÃO</label><input type="datetime-local" value={expiresAt} onChange={e=>setExpiresAt(e.target.value)} className="bg-black/40 border border-white/10 px-3 py-2"/></div>
                        <div className="flex items-center gap-2 pt-4 px-2"><input type="checkbox" checked={couponActive} onChange={e=>setCouponActive(e.target.checked)} className="accent-primary"/> <span>ATIVO</span></div>
                        <div className="md:col-span-2 flex gap-2 pt-2">
                          <button type="submit" disabled={saving} className="btn-explore flex-1 py-3 text-[9px]">{saving ? "SALVANDO..." : "SALVAR CUPOM"}</button>
                          <button type="button" onClick={() => setShowCouponForm(false)} className="px-4 border border-white/10 text-[9px]">CANCELAR</button>
                        </div>
                      </form>
                    </motion.div>
                  )}

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead><tr className="border-b border-white/5 text-[10px] tracking-[0.3em] text-muted-foreground"><th className="py-4 px-2">CÓDIGO</th><th className="py-4 px-2">VALOR</th><th className="py-4 px-2">EXPIRAÇÃO</th><th className="py-4 px-2">STATUS</th><th className="py-4 px-2 text-right">AÇÕES</th></tr></thead>
                      <tbody className="divide-y divide-white/5">
                        {couponsList.map(c => (
                          <tr key={c.id} className="hover:bg-white/[0.02]">
                            <td className="py-4 px-2 font-bold text-primary tracking-widest">{c.code}</td>
                            <td className="py-4 px-2 text-[10px]">{c.discount_type === "percentage" ? `${c.discount_value}%` : `R$ ${c.discount_value}`}</td>
                            <td className="py-4 px-2 text-[10px] text-muted-foreground">{c.expires_at ? new Date(c.expires_at).toLocaleDateString() : "INFINITO"}</td>
                            <td className="py-4 px-2">
                              <span className={`px-2 py-0.5 border text-[8px] ${c.active ? 'border-primary text-primary' : 'border-red-500 text-red-500'}`}>{c.active ? "ATIVO" : "INATIVO"}</span>
                            </td>
                            <td className="py-4 px-2 text-right space-x-1">
                               <button onClick={() => toggleCoupon(c)} className="p-1 hover:text-primary transition-colors">{c.active ? <XCircle size={14}/> : <CheckCircle2 size={14}/>}</button>
                               <button onClick={() => openEditCoupon(c)} className="p-1 hover:text-primary transition-colors"><Tag size={14}/></button>
                               <button onClick={() => deleteCoupon(c.id)} className="p-1 hover:text-red-500 transition-colors"><Trash2 size={14}/></button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
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
