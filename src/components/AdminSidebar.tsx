import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PlusCircle, BarChart, Settings, LogOut, Star, List, Edit3, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/hooks/useProducts";

const AdminSidebar = () => {
  const [session, setSession] = useState<any>(null);
  
  // Modal & View states
  const [showModal, setShowModal] = useState(false);
  const [showList, setShowList] = useState(false);
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

  const [showSettings, setShowSettings] = useState(false);
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
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (!session) return null;

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const fetchProducts = async () => {
    setLoadingList(true);
    // Invalidate admin cache to force a fresh fetch
    await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.adminProducts });
    const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    if (data) setProductList(data);
    setLoadingList(false);
  };

  const openAddModal = () => {
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
    setShowModal(true);
  };

  const openEditModal = (product: any) => {
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
    setShowModal(true);
    setShowList(false);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    let finalUrls: string[] = [];

    // First, upload new files
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

    if (coverImageSource === "existing" && coverImageIndex < existingImages.length) {
      coverUrl = existingImages[coverImageIndex];
    } else if (coverImageSource === "new" && coverImageIndex < finalUrls.length) {
      coverUrl = finalUrls[coverImageIndex];
    }

    if (coverUrl) {
      resultList = [coverUrl, ...resultList.filter(u => u !== coverUrl)];
    }

    const imageUrlsString = resultList.join(',');
    const priceNum = parseFloat(prodPrice);
    const stockNum = parseInt(prodStock, 10);
    const sizesArray = prodSizes.split(",").map((s) => s.trim()).filter((s) => s);
    const colorsArray = prodColors.split(",").map((c) => c.trim()).filter((c) => c);

    const productData = {
      name: prodName,
      description: prodDesc || null,
      category: prodCategory,
      price: priceNum,
      sizes: sizesArray.length > 0 ? sizesArray : null,
      colors: colorsArray.length > 0 ? colorsArray : null,
      stock_quantity: stockNum,
      image_url: imageUrlsString || null
    };

    // ── Optimistic Update ──────────────────────────────────────────────────────
    // Snapshot previous cache for rollback
    const previousProducts = queryClient.getQueryData(QUERY_KEYS.products);
    const previousAdmin = queryClient.getQueryData(QUERY_KEYS.adminProducts);

    if (isEditing && editingId) {
      // Optimistically update product in both caches
      queryClient.setQueryData(QUERY_KEYS.products, (old: any[] = []) =>
        old.map(p => p.id === editingId ? { ...p, ...productData } : p)
      );
      queryClient.setQueryData(QUERY_KEYS.adminProducts, (old: any[] = []) =>
        old.map(p => p.id === editingId ? { ...p, ...productData } : p)
      );
    } else {
      // Optimistically add a temporary product at the top
      const tempId = `optimistic-${Date.now()}`;
      queryClient.setQueryData(QUERY_KEYS.adminProducts, (old: any[] = []) => [
        { id: tempId, ...productData, created_at: new Date().toISOString() },
        ...old
      ]);
    }

    // ── Server call ────────────────────────────────────────────────────────────
    let result;
    if (isEditing && editingId) {
      result = await supabase.from('products').update(productData).eq('id', editingId);
    } else {
      result = await supabase.from('products').insert(productData);
    }

    setSaving(false);
    if (result.error) {
      // Rollback optimistic update on failure
      queryClient.setQueryData(QUERY_KEYS.products, previousProducts);
      queryClient.setQueryData(QUERY_KEYS.adminProducts, previousAdmin);
      setError("Erro ao salvar: " + result.error.message);
    } else {
      setSuccess(isEditing ? "Produto atualizado!" : "Produto adicionado!");
      // Invalidate to sync real server data (replaces optimistic temp record)
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.products });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.trending });
      if (!isEditing) {
        setProdName("");
        setProdDesc("");
        setProdPrice("");
        setImageFiles([]);
        setCoverImageIndex(0);
      }
      setTimeout(() => {
        setSuccess(null);
        if (isEditing) {
          setShowModal(false);
          setShowList(true);
        }
      }, 2000);
      fetchProducts();
    }
  };

  const deleteProduct = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este produto?")) return;

    // ── Optimistic delete ───────────────────────────────────────────────────
    const previousProducts = queryClient.getQueryData(QUERY_KEYS.products);
    const previousAdmin = queryClient.getQueryData(QUERY_KEYS.adminProducts);

    queryClient.setQueryData(QUERY_KEYS.products, (old: any[] = []) => old.filter(p => p.id !== id));
    queryClient.setQueryData(QUERY_KEYS.adminProducts, (old: any[] = []) => old.filter(p => p.id !== id));
    setProductList(prev => prev.filter(p => p.id !== id));

    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) {
      // Rollback
      queryClient.setQueryData(QUERY_KEYS.products, previousProducts);
      queryClient.setQueryData(QUERY_KEYS.adminProducts, previousAdmin);
      alert("Erro ao excluir: " + error.message);
    } else {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.products });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.trending });
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) setPassMessage("Erro: " + error.message);
    else {
      setPassMessage("Senha atualizada com sucesso.");
      setNewPassword("");
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      if (files.length > 9) {
        setError("Máximo de 9 imagens permitidas");
        return;
      }
      setImageFiles(files);
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
      const newFiles = [...imageFiles];
      newFiles.splice(index, 1);
      setImageFiles(newFiles);
      if (coverImageSource === "new" && coverImageIndex === index) {
        setCoverImageIndex(0);
        setCoverImageSource("existing");
      }
    }
  };

  return (
    <>
      <div className="absolute inset-y-0 left-6 z-40 flex items-center pointer-events-none">
        <div className="hidden md:flex flex-col gap-4 bg-card/60 backdrop-blur-md p-3 border border-border animate-fade-up pointer-events-auto">
          <button 
            onClick={openAddModal}
            className="p-3 text-muted-foreground hover:text-foreground hover:bg-background transition-colors rounded-sm group relative"
            title="Adicionar Produto"
          >
            <PlusCircle size={20} strokeWidth={1.5} />
            <span className="absolute left-full ml-4 top-1/2 -translate-y-1/2 px-2 py-1 bg-foreground text-background text-[10px] font-display uppercase tracking-widest whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              Adicionar Produto
            </span>
          </button>
          <button 
            onClick={() => { setShowList(!showList); fetchProducts(); }}
            className="p-3 text-muted-foreground hover:text-foreground hover:bg-background transition-colors rounded-sm group relative"
            title="Ver Produtos"
          >
            <List size={20} strokeWidth={1.5} />
            <span className="absolute left-full ml-4 top-1/2 -translate-y-1/2 px-2 py-1 bg-foreground text-background text-[10px] font-display uppercase tracking-widest whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              Lista de Produtos
            </span>
          </button>
          <button 
            className="p-3 text-muted-foreground hover:text-foreground hover:bg-background transition-colors rounded-sm group relative"
            title="Estatísticas WIP"
          >
            <BarChart size={20} strokeWidth={1.5} />
            <span className="absolute left-full ml-4 top-1/2 -translate-y-1/2 px-2 py-1 bg-foreground text-background text-[10px] font-display uppercase tracking-widest whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              Estatísticas
            </span>
          </button>
          <button 
            onClick={() => setShowSettings(!showSettings)}
            className="p-3 text-muted-foreground hover:text-foreground hover:bg-background transition-colors rounded-sm group relative"
            title="Configurações"
          >
            <Settings size={20} strokeWidth={1.5} />
            <span className="absolute left-full ml-4 top-1/2 -translate-y-1/2 px-2 py-1 bg-foreground text-background text-[10px] font-display uppercase tracking-widest whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              Configurações
            </span>
          </button>
          <div className="h-[1px] w-full bg-border my-2" />
          <button 
            onClick={handleLogout}
            className="p-3 text-muted-foreground hover:text-destructive hover:bg-background transition-colors rounded-sm group relative"
            title="Sair"
          >
            <LogOut size={20} strokeWidth={1.5} />
            <span className="absolute left-full ml-4 top-1/2 -translate-y-1/2 px-2 py-1 bg-destructive text-background text-[10px] font-display uppercase tracking-widest whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              Sair do Painel
            </span>
          </button>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-fade-up">
          <div className="product-card p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto bg-card shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-display text-xl tracking-[0.2em] text-foreground">
                {isEditing ? "EDITAR PRODUTO" : "NOVO PRODUTO"}
              </h2>
              <button 
                onClick={() => {
                  setShowModal(false);
                  if (isEditing) setShowList(true);
                }} 
                className="text-muted-foreground hover:text-foreground text-xl"
              >
                ✕
              </button>
            </div>

            {error && <div className="text-destructive text-[10px] bg-destructive/10 p-2 border border-destructive/20 font-display mb-4">{error}</div>}
            {success && <div className="text-green-500 text-[10px] bg-green-500/10 p-2 border border-green-500/20 font-display mb-4">{success}</div>}

            <form onSubmit={handleSaveProduct} className="flex flex-col gap-4 text-left">
              <div className="flex flex-col gap-1">
                <label className="font-display text-[10px] tracking-widest text-muted-foreground">NOME *</label>
                <input type="text" required value={prodName} onChange={(e) => setProdName(e.target.value)} className="bg-background border border-border px-4 py-2 text-sm text-foreground focus:outline-none focus:border-primary transition-colors" />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-display text-[10px] tracking-widest text-muted-foreground">DESCRIÇÃO</label>
                <textarea rows={3} value={prodDesc} onChange={(e) => setProdDesc(e.target.value)} className="bg-background border border-border px-4 py-2 text-sm text-foreground focus:outline-none focus:border-primary transition-colors resize-none" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="font-display text-[10px] tracking-widest text-muted-foreground">CATEGORIA *</label>
                  <select required value={prodCategory} onChange={(e) => setProdCategory(e.target.value)} className="bg-background border border-border px-4 py-2 text-sm text-foreground focus:outline-none focus:border-primary transition-colors appearance-none">
                    <option value="Camisetas">Camisetas</option>
                    <option value="Moletons">Moletons</option>
                    <option value="Calças">Calças</option>
                    <option value="Tênis">Tênis</option>
                    <option value="Acessórios">Acessórios</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-display text-[10px] tracking-widest text-muted-foreground">PREÇO *</label>
                  <input type="number" step="0.01" min="0" required value={prodPrice} onChange={(e) => setProdPrice(e.target.value)} placeholder="0.00" className="bg-background border border-border px-4 py-2 text-sm text-foreground focus:outline-none focus:border-primary transition-colors" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="font-display text-[10px] tracking-widest text-muted-foreground">TAMANHOS (separe por vírgula)</label>
                  <input type="text" value={prodSizes} onChange={(e) => setProdSizes(e.target.value)} placeholder="P, M, G, GG" className="bg-background border border-border px-4 py-2 text-sm text-foreground focus:outline-none focus:border-primary transition-colors" />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-display text-[10px] tracking-widest text-muted-foreground">CORES (separe por vírgula)</label>
                  <input type="text" value={prodColors} onChange={(e) => setProdColors(e.target.value)} placeholder="Preto, Branco" className="bg-background border border-border px-4 py-2 text-sm text-foreground focus:outline-none focus:border-primary transition-colors" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="font-display text-[10px] tracking-widest text-muted-foreground">ESTOQUE *</label>
                  <input type="number" min="0" required value={prodStock} onChange={(e) => setProdStock(e.target.value)} className="bg-background border border-border px-4 py-2 text-sm text-foreground focus:outline-none focus:border-primary transition-colors" />
                </div>

                <div className="flex flex-col gap-1 flex-1">
                  <label className="font-display text-[10px] tracking-widest text-muted-foreground">IMAGENS (MÁX 9 TOTAL) - ESTRELA PARA CAPA</label>
                  <input type="file" multiple accept="image/*" onChange={handleImageChange} className="bg-background border border-border px-4 py-2 text-[10px] text-foreground focus:outline-none focus:border-primary transition-colors file:bg-primary file:text-primary-foreground file:border-0 file:px-2 file:py-1 file:mr-2 file:cursor-pointer" />
                </div>
              </div>

              {/* Existing Images and New Previews */}
              <div className="grid grid-cols-5 gap-2 mt-2">
                {/* Existing */}
                {existingImages.map((url, idx) => (
                  <div key={`exist-${idx}`} className="relative aspect-square border border-border bg-secondary group/img">
                    <img src={url} alt="Existente" className="w-full h-full object-cover" />
                    <button 
                      type="button" 
                      onClick={() => { setCoverImageIndex(idx); setCoverImageSource("existing"); }} 
                      className={`absolute top-1 left-1 p-1 rounded-full backdrop-blur-md transition-colors ${coverImageSource === "existing" && coverImageIndex === idx ? 'bg-primary text-primary-foreground' : 'bg-background/50 text-foreground/50'}`}
                    >
                      <Star size={8} fill={coverImageSource === "existing" && coverImageIndex === idx ? "currentColor" : "none"} />
                    </button>
                    <button type="button" onClick={() => removeImage(idx, "existing")} className="absolute top-1 right-1 p-1 bg-destructive/80 text-white rounded-full opacity-0 group-hover/img:opacity-100 transition-opacity">
                      <LogOut size={8} className="rotate-90" />
                    </button>
                  </div>
                ))}
                {/* Previews */}
                {imageFiles.map((file, idx) => (
                  <div key={`new-${idx}`} className="relative aspect-square border border-border bg-secondary group/img">
                    <img src={URL.createObjectURL(file)} alt="Preview" className="w-full h-full object-cover" />
                    <button 
                      type="button" 
                      onClick={() => { setCoverImageIndex(idx); setCoverImageSource("new"); }} 
                      className={`absolute top-1 left-1 p-1 rounded-full backdrop-blur-md transition-colors ${coverImageSource === "new" && coverImageIndex === idx ? 'bg-primary text-primary-foreground' : 'bg-background/50 text-foreground/50'}`}
                    >
                      <Star size={8} fill={coverImageSource === "new" && coverImageIndex === idx ? "currentColor" : "none"} />
                    </button>
                    <button type="button" onClick={() => removeImage(idx, "new")} className="absolute top-1 right-1 p-1 bg-destructive/80 text-white rounded-full opacity-0 group-hover/img:opacity-100 transition-opacity">
                      <LogOut size={8} className="rotate-90" />
                    </button>
                  </div>
                ))}
              </div>

              <button type="submit" disabled={saving} className="btn-explore mt-4 text-center">
                {saving ? "SALVANDO..." : (isEditing ? "ATUALIZAR" : "SALVAR PRODUTO")}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Product List Modal */}
      {showList && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-fade-up">
          <div className="product-card p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-card shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-display text-xl tracking-[0.2em] text-foreground">PRODUTOS CADASTRADOS</h2>
              <button onClick={() => setShowList(false)} className="text-muted-foreground hover:text-foreground text-xl">
                ✕
              </button>
            </div>
            
            {loadingList ? (
              <div className="py-20 flex justify-center"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
            ) : productList.length === 0 ? (
              <p className="text-center py-20 text-muted-foreground font-display text-xs tracking-widest">NENHUM PRODUTO ENCONTRADO</p>
            ) : (
              <div className="flex flex-col divide-y divide-border">
                {productList.map((p) => (
                  <div key={p.id} className="py-4 flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-secondary border border-border overflow-hidden">
                        {p.image_url && <img src={p.image_url.split(',')[0]} className="w-full h-full object-cover" />}
                      </div>
                      <div>
                        <h4 className="font-display text-[10px] tracking-widest text-foreground">{p.name}</h4>
                        <p className="text-[9px] text-muted-foreground tracking-widest mt-1 uppercase">{p.category} — R$ {p.price.toFixed(2)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEditModal(p)} className="p-2 text-muted-foreground hover:text-primary transition-colors bg-background/50 border border-border">
                        <Edit3 size={14} />
                      </button>
                      <button onClick={() => deleteProduct(p.id)} className="p-2 text-muted-foreground hover:text-destructive transition-colors bg-background/50 border border-border">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-fade-up">
          <div className="product-card p-6 w-full max-w-sm bg-card">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-display text-xl tracking-[0.2em] text-foreground">PERFIL ADM</h2>
              <button onClick={() => { setShowSettings(false); setPassMessage(null); }} className="text-muted-foreground hover:text-foreground text-xl">
                ✕
              </button>
            </div>

            {passMessage && <div className="text-[10px] bg-background/50 p-2 border border-border font-display mb-4 text-foreground">{passMessage}</div>}

            <form onSubmit={handleUpdatePassword} className="flex flex-col gap-4 text-left">
              <div className="flex flex-col gap-1">
                <label className="font-display text-[10px] tracking-widest text-muted-foreground">NOVA SENHA</label>
                <input type="password" required value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="bg-background border border-border px-4 py-2 text-sm text-foreground focus:outline-none focus:border-primary transition-colors" />
              </div>

              <button type="submit" className="btn-explore mt-2 text-center">
                ATUALIZAR SENHA
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminSidebar;
