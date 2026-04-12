import { useOrders } from "@/hooks/useOrders";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CosmicElements from "@/components/CosmicElements";
import { Package, Calendar, Tag, ChevronDown, ExternalLink } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const Orders = () => {
  const { data: orders, isLoading, error } = useOrders();
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'paid':
        return 'text-primary border-primary/20';
      case 'pending':
        return 'text-yellow-500 border-yellow-500/20';
      case 'canceled':
      case 'failed':
        return 'text-red-500 border-red-500/20';
      default:
        return 'text-muted-foreground border-white/10';
    }
  };

  const translateStatus = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'paid':
        return 'CONCLUÍDO';
      case 'pending':
        return 'PENDENTE';
      case 'canceled':
        return 'CANCELADO';
      default:
        return status.toUpperCase();
    }
  };

  return (
    <div className="min-h-screen bg-background text-white flex flex-col font-display uppercase selection:bg-primary selection:text-black">
      <Navbar />
      
      <main className="flex-1 pt-32 pb-20 relative spacetime-grid overflow-hidden">
        <CosmicElements />
        
        <div className="container mx-auto px-6 relative z-10">
          <header className="mb-12 text-center md:text-left">
            <h1 className="text-3xl md:text-4xl tracking-[0.4em] mb-3 animate-fade-up">MEUS PEDIDOS</h1>
            <p className="text-[10px] tracking-[0.3em] text-muted-foreground animate-fade-up delay-100">
              HISTÓRICO DE AQUISIÇÕES NO VOID
            </p>
          </header>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-8 h-8 border-y border-primary rounded-full animate-spin" />
              <p className="text-[10px] tracking-widest text-muted-foreground">SINCRONIZANDO DADOS...</p>
            </div>
          ) : error ? (
            <div className="product-card p-10 bg-card/40 border-red-500/20 text-center">
              <p className="text-red-500 text-xs tracking-widest">ERRO AO CARREGAR PEDIDOS</p>
            </div>
          ) : !orders || orders.length === 0 ? (
            <div className="product-card p-20 bg-card/40 border-white/5 text-center flex flex-col items-center">
              <Package size={40} className="text-muted-foreground/30 mb-6" />
              <p className="text-xs tracking-[0.3em] text-muted-foreground mb-8">VOCÊ AINDA NÃO POSSUI PEDIDOS</p>
              <button 
                onClick={() => window.location.href = '/'}
                className="btn-explore px-10 py-4 text-[10px]"
              >
                EXPLORAR LOJA
              </button>
            </div>
          ) : (
            <div className="grid gap-6 max-w-4xl mx-auto">
              {orders.map((order, idx) => (
                <motion.div 
                  key={order.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="product-card bg-card/40 backdrop-blur-md border-white/5 overflow-hidden"
                >
                  <div 
                    className="p-6 cursor-pointer flex flex-wrap items-center justify-between gap-4"
                    onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-sm bg-white/5 flex items-center justify-center border border-white/10">
                        <Package size={20} className="text-primary/70" />
                      </div>
                      <div>
                        <p className="text-[10px] tracking-widest text-muted-foreground mb-1">PEDIDO #{order.id.slice(0, 8)}</p>
                        <p className="text-sm font-display tracking-widest">R$ {order.total_amount.toFixed(2)}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 md:gap-8">
                      <div className="flex items-center gap-2">
                        <Calendar size={12} className="text-muted-foreground" />
                        <span className="text-[9px] tracking-widest text-muted-foreground">
                          {new Date(order.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      
                      <div className={`px-3 py-1 border text-[9px] tracking-[0.2em] font-bold ${getStatusColor(order.status)}`}>
                        {translateStatus(order.status)}
                      </div>

                      <ChevronDown 
                        size={16} 
                        className={`text-muted-foreground transition-transform duration-300 ${expandedOrder === order.id ? 'rotate-180' : ''}`} 
                      />
                    </div>
                  </div>

                  <AnimatePresence>
                    {expandedOrder === order.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-white/5 bg-black/20"
                      >
                        <div className="p-6 space-y-6">
                          <div className="grid gap-4">
                            {order.order_items?.map((item: any) => (
                              <div key={item.id} className="flex items-center justify-between group">
                                <div className="flex items-center gap-4">
                                  <div className="w-16 h-16 bg-white/5 border border-white/10 overflow-hidden">
                                    {item.products?.image_url && (
                                      <img 
                                        src={item.products.image_url.split(',')[0]} 
                                        alt={item.products.name} 
                                        className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" 
                                      />
                                    )}
                                  </div>
                                  <div>
                                    <h4 className="text-[10px] tracking-widest text-foreground font-display">{item.products?.name}</h4>
                                    <p className="text-[9px] text-muted-foreground tracking-widest mt-1">
                                      {item.quantity}X — {item.size || 'PADRÃO'} / {item.color || 'PADRÃO'}
                                    </p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="text-[10px] tracking-widest">R$ {item.price.toFixed(2)}</p>
                                </div>
                              </div>
                            ))}
                          </div>

                          <div className="pt-6 border-t border-white/5 flex flex-col md:flex-row justify-between gap-6">
                            <div className="space-y-4">
                              <div>
                                <h5 className="text-[8px] tracking-[0.3em] text-muted-foreground mb-2">ENDEREÇO DE ENTREGA</h5>
                                {order.addresses && order.addresses.length > 0 ? (
                                  <div className="text-[10px] tracking-[0.2em] text-muted-foreground/80 font-body space-y-1">
                                    <p className="text-foreground uppercase font-display">{order.addresses[0].full_name}</p>
                                    <p>{order.addresses[0].street}, {order.addresses[0].number}{order.addresses[0].complement ? ` - ${order.addresses[0].complement}` : ''}</p>
                                    <p>{order.addresses[0].neighborhood}</p>
                                    <p>{order.addresses[0].city} / {order.addresses[0].state} — {order.addresses[0].zip_code}</p>
                                    {order.addresses[0].phone && <p className="mt-2 text-[9px]">TEL: {order.addresses[0].phone}</p>}
                                  </div>
                                ) : (
                                  <p className="text-[10px] tracking-[0.2em] text-muted-foreground/80 italic font-body">
                                    {order.full_name} — {order.email}
                                  </p>
                                )}
                              </div>
                              {order.payment_status_detail && (
                                <div className="pt-2">
                                  <h5 className="text-[8px] tracking-[0.3em] text-red-500/70 mb-1">DETALHE DO PAGAMENTO</h5>
                                  <p className="text-[9px] tracking-[0.1em] text-muted-foreground uppercase">{order.payment_status_detail}</p>
                                </div>
                              )}
                            </div>

                            <div className="bg-white/5 p-4 border border-white/10 min-w-[200px]">
                              <div className="flex justify-between mb-2">
                                <span className="text-[9px] tracking-widest text-muted-foreground">SUBTOTAL</span>
                                <span className="text-[9px] tracking-widest">R$ {order.total_amount.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between mb-4">
                                <span className="text-[9px] tracking-widest text-muted-foreground">FRETE</span>
                                <span className="text-[9px] tracking-widest text-primary">GRÁTIS</span>
                              </div>
                              <div className="flex justify-between border-t border-white/10 pt-2 text-primary">
                                <span className="text-[10px] tracking-[0.2em] font-bold">TOTAL</span>
                                <span className="text-[10px] tracking-[0.2em] font-bold">R$ {order.total_amount.toFixed(2)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
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

export default Orders;
