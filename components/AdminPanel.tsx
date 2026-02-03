import React, { useState, useRef, useEffect, useMemo } from 'react';
import { getCurrentProfile, updateStoreProfile, Profile } from '../services/profiles';
import {
  LayoutDashboard,
  ShoppingBag,
  Plus,
  Package,
  LogOut,
  CheckCircle,
  ChefHat,
  Clock,
  Trash2,
  Archive,
  MessageCircle,
  User,
  Zap,
  Camera,
  Image as ImageIcon,
  Loader2,
  Info,
  Settings,
  DollarSign
} from 'lucide-react';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { CATEGORIES } from '../constants';
import { Order, Product, Message } from '../types';
import NavButton from './shared/NavButton';
import AppHeader from './shared/AppHeader';
import Modal from './shared/Modal';
import ChatInterface from './shared/ChatInterface';
import { supabase } from '../services/supabase';
import { getProductsByStore, addProduct, deleteProduct } from '../services/products';
import { uploadProductImage } from '../services/storage';
import { getOrdersByStore, subscribeToStoreOrders, getOrderMessages, sendOrderMessage, subscribeToOrderMessages, updateOrderStatus } from '../services/orders';

interface AdminPanelProps {
  onSwitchMode: () => void;
  orders: Order[];
  onUpdateOrder: (id: string, status: Order['status']) => void;
  onDeleteOrder: (id: string) => void;
  messages: Message[];
  onSendMessage: (orderId: string, text: string, sender: 'user' | 'store') => void;
}



const StatCard: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({ icon, label, value }) => (
  <div className="bg-white p-5 lg:p-7 rounded-[2rem] lg:rounded-[2.5rem] shadow-sm border-2 border-gray-50">
    <div className="text-gray-400 text-[9px] lg:text-[10px] font-black uppercase tracking-widest mb-1 flex items-center gap-2">
      {icon} {label}
    </div>
    <p className="text-2xl lg:text-4xl font-black text-gray-900 italic tracking-tighter">{value}</p>
  </div>
);

const statusColors: { [key: string]: string } = {
  pending: 'bg-red-100 text-red-600',
  confirmed: 'bg-orange-100 text-orange-600',
  ready: 'bg-blue-100 text-blue-600',
  shipping: 'bg-purple-100 text-purple-600',
  delivered: 'bg-green-100 text-green-600',
  cancelled: 'bg-gray-100 text-gray-600',
  accepted: 'bg-indigo-100 text-indigo-600',
};

const AdminPanel: React.FC<AdminPanelProps> = ({ onSwitchMode }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showNewProductModal, setShowNewProductModal] = useState(false);
  const [activeChatOrder, setActiveChatOrder] = useState<Order | null>(null);
  const [localProducts, setLocalProducts] = useState<Product[]>([]);
  const [storeId, setStoreId] = useState<string | null>(null);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [dbOrders, setDbOrders] = useState<Order[]>([]);
  const [orderMessages, setOrderMessages] = useState<Message[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [storeProfile, setStoreProfile] = useState<Profile | null>(null);
  const [storeImageFile, setStoreImageFile] = useState<File | null>(null);
  const [storeImagePreview, setStoreImagePreview] = useState<string | null>(null);
  const [isUploadingStoreImage, setIsUploadingStoreImage] = useState(false);
  const [lastDeliveredOrder, setLastDeliveredOrder] = useState<Order | null>(null);
  const [showDeliveryPopup, setShowDeliveryPopup] = useState(false);

  useEffect(() => {
    let orderSub: any;

    const initPanel = async () => {
      setLoadingProducts(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setStoreId(user.id);
          const [products, fetchedOrders, profile] = await Promise.all([
            getProductsByStore(user.id),
            getOrdersByStore(user.id),
            getCurrentProfile()
          ]);
          setLocalProducts(products);
          setDbOrders(fetchedOrders);
          setStoreProfile(profile);
          if (profile?.image_url) {
            setStoreImagePreview(profile.image_url);
          }

          orderSub = subscribeToStoreOrders(user.id, (order, eventType) => {
            setDbOrders(prev => {
              if (eventType === 'INSERT') {
                if (prev.some(o => o.id === order.id)) return prev;
                return [order, ...prev];
              } else {
                // Check for delivery completion to show popup
                if (order.status === 'delivered') {
                  const oldOrder = prev.find(o => o.id === order.id);
                  if (oldOrder && oldOrder.status !== 'delivered') {
                    setLastDeliveredOrder(order);
                    setShowDeliveryPopup(true);
                    // Auto hide after 5 seconds
                    setTimeout(() => setShowDeliveryPopup(false), 5000);
                  }
                }
                return prev.map(o => o.id === order.id ? order : o);
              }
            });
          });
        }
      } catch (error) {
        console.error('Error initializing Admin Panel:', error);
      } finally {
        setLoadingProducts(false);
      }
    };

    initPanel();

    return () => {
      if (orderSub) {
        orderSub.unsubscribe();
      }
    };
  }, []);

  useEffect(() => {
    if (activeChatOrder && storeId) {
      const fetchMsgs = async () => {
        const msgs = await getOrderMessages(activeChatOrder.id, activeChatOrder.customerId);
        setOrderMessages(msgs);
      };
      fetchMsgs();

      const sub = subscribeToOrderMessages(activeChatOrder.id, (msg) => {
        const mappedMsg = {
          ...msg,
          sender: msg.sender_id === storeId ? 'store' : 'user'
        };
        setOrderMessages(prev => {
          if (prev.some(m => m.id === mappedMsg.id)) return prev;
          return [...prev, mappedMsg];
        });
      });

      return () => {
        sub.unsubscribe();
      };
    }
  }, [activeChatOrder, storeId]);

  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    price: '',
    category: CATEGORIES[1].name,
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80'
  });

  const handleRemoveProduct = async (id: string) => {
    if (confirm('Deseja realmente excluir este item do cardápio permanentemente?')) {
      const success = await deleteProduct(id);
      if (success) {
        setLocalProducts(prev => prev.filter(p => p.id !== id));
      } else {
        alert('Erro ao deletar produto. Tente novamente.');
      }
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeId) return;

    setIsUploading(true);
    let imageUrl = newProduct.image;

    if (imageFile) {
      const uploadedUrl = await uploadProductImage(imageFile, storeId);
      if (uploadedUrl) {
        imageUrl = uploadedUrl;
      } else {
        alert('Erro ao subir imagem. O produto será criado com a imagem padrão.');
      }
    }

    const productData: Omit<Product, 'id'> = {
      name: newProduct.name,
      description: newProduct.description,
      price: parseFloat(newProduct.price),
      category: newProduct.category,
      image: imageUrl,
      store_id: storeId
    };

    const addedProduct = await addProduct(productData, storeId);

    if (addedProduct) {
      setLocalProducts(prev => [addedProduct, ...prev]);
      setShowNewProductModal(false);
      setNewProduct({
        name: '',
        description: '',
        price: '',
        category: CATEGORIES[1].name,
        image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80'
      });
      setImageFile(null);
      setImagePreview(null);
    } else {
      alert('Erro ao adicionar produto. Tente novamente.');
    }
    setIsUploading(false);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleStoreImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setStoreImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setStoreImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateStoreImage = async () => {
    if (!storeId || !storeImageFile) return;

    setIsUploadingStoreImage(true);
    const uploadedUrl = await uploadProductImage(storeImageFile, storeId);

    if (uploadedUrl) {
      const success = await updateStoreProfile(storeId, { image_url: uploadedUrl });
      if (success) {
        setStoreProfile(prev => prev ? { ...prev, image_url: uploadedUrl } : null);
        alert('Imagem da loja atualizada com sucesso!');
      } else {
        alert('Erro ao atualizar imagem da loja.');
      }
    } else {
      alert('Erro ao fazer upload da imagem.');
    }
    setIsUploadingStoreImage(false);
  };

  const handleUpdateStatus = async (id: string, status: Order['status']) => {
    const success = await updateOrderStatus(id, status);

    if (success) {
      setDbOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
    } else {
      alert('Erro ao atualizar status.');
    }
  };

  const handleDeleteOrder = async (id: string) => {
    if (confirm('Deseja realmente excluir este pedido?')) {
      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', id);

      if (!error) {
        setDbOrders(prev => prev.filter(o => o.id !== id));
      } else {
        alert('Erro ao excluir pedido.');
      }
    }
  };

  const handleSendMessageLocally = async (text: string) => {
    if (!activeChatOrder || !storeId || !text.trim()) return;

    const tempId = Date.now().toString();
    const optimisticMsg: Message = {
      id: tempId,
      order_id: activeChatOrder.id,
      sender_id: storeId,
      text: text,
      sender: 'store',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      created_at: new Date().toISOString()
    };

    setOrderMessages(prev => [...prev, optimisticMsg]);

    const sent = await sendOrderMessage(activeChatOrder.id, storeId, text);
    if (sent) {
      setOrderMessages(prev => prev.map(m => m.id === tempId ? { ...sent, sender: 'store' } : m));
    } else {
      setOrderMessages(prev => prev.filter(m => m.id !== tempId));
      alert('Erro ao enviar mensagem.');
    }
  };

  const statusMap: any = {
    pending: 'Pendente',
    confirmed: 'Em Preparo',
    ready: 'Pronto',
    shipping: 'Em Entrega',
    delivered: 'Entregue',
    cancelled: 'Cancelado',
    accepted: 'Entregador a Caminho'
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-gray-50">
      <aside className="w-64 bg-white border-r hidden lg:flex flex-col sticky top-0 h-screen">
        <div className="p-6 border-b">
          <div className="flex items-center text-red-600 font-black text-2xl tracking-tight italic gap-1">
            <Zap className="fill-red-600 text-red-600" size={24} />
            <span>PedeAí</span>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <button onClick={() => setActiveTab('dashboard')} className={`w-full flex items-center p-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'dashboard' ? 'bg-red-50 text-red-600 shadow-sm' : 'text-gray-400 hover:bg-gray-100'}`}>
            <LayoutDashboard className="mr-3" size={20} /> Painel
          </button>
          <button onClick={() => setActiveTab('orders')} className={`w-full flex items-center p-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'orders' ? 'bg-red-50 text-red-600 shadow-sm' : 'text-gray-400 hover:bg-gray-100'}`}>
            <div className="relative mr-3">
              <Package size={20} />
              {dbOrders.filter(o => o.status === 'pending').length > 0 && <span className="absolute -top-1 -right-1 bg-red-600 w-2.5 h-2.5 rounded-full border-2 border-white"></span>}
            </div>
            Pedidos
          </button>
          <button onClick={() => setActiveTab('inventory')} className={`w-full flex items-center p-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'inventory' ? 'bg-red-50 text-red-600 shadow-sm' : 'text-gray-400 hover:bg-gray-100'}`}>
            <ShoppingBag className="mr-3" size={20} /> Cardápio
          </button>
          <button onClick={() => setActiveTab('settings')} className={`w-full flex items-center p-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'settings' ? 'bg-red-50 text-red-600 shadow-sm' : 'text-gray-400 hover:bg-gray-100'}`}>
            <Settings className="mr-3" size={20} /> Configurações
          </button>
        </nav>

        <div className="p-4 border-t space-y-2">
          <button onClick={onSwitchMode} className="w-full flex items-center p-4 rounded-2xl text-xs font-black uppercase tracking-widest text-red-600 hover:bg-red-50 transition-colors">
            <LogOut className="mr-3" size={20} /> Sair do Painel
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto pb-32 lg:pb-0">
        <AppHeader
          title={activeTab === 'dashboard' ? 'Métricas' : activeTab === 'orders' ? 'Pedidos' : activeTab === 'settings' ? 'Configurações' : 'Cardápio'}
          rightElement={
            <button onClick={onSwitchMode} className="p-2.5 text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-all shadow-sm">
              <LogOut size={20} />
            </button>
          }
        />

        {/* Delivery Success Popup */}
        {showDeliveryPopup && lastDeliveredOrder && (
          <div className="fixed top-24 right-6 z-[100] animate-in slide-in-from-right-10 duration-500">
            <div className="bg-white p-6 rounded-[2rem] shadow-2xl border-2 border-green-100 flex items-center gap-4 max-w-sm">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center shrink-0">
                <CheckCircle className="text-green-600" size={24} />
              </div>
              <div>
                <h4 className="font-black text-gray-900 italic uppercase">Pedido Entregue!</h4>
                <p className="text-xs text-gray-500 font-bold">O pedido #{lastDeliveredOrder.id.slice(0, 8)} foi finalizado com sucesso.</p>
              </div>
              <button onClick={() => setShowDeliveryPopup(false)} className="ml-2 text-gray-400 hover:text-gray-600">
                <XAxis size={18} />
              </button>
            </div>
          </div>
        )}

        <div className="p-4 lg:p-8 max-w-6xl mx-auto space-y-6 lg:space-y-8">
          {activeTab === 'dashboard' && (
            <>
              {/* Revenue Calculation */}
              {(() => {
                const totalRevenue = dbOrders
                  .filter(o => o.status === 'delivered')
                  .reduce((sum, order) => sum + order.total, 0);

                return (
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6">
                    <StatCard icon={<DollarSign />} label="Faturamento" value={`R$ ${totalRevenue.toFixed(2)}`} />
                    <StatCard icon={<ShoppingBag />} label="Total Pedidos" value={dbOrders.length.toString()} />
                    <StatCard icon={<Clock />} label="Ativos" value={dbOrders.filter(o => ['pending', 'confirmed', 'ready'].includes(o.status)).length.toString()} />
                    <StatCard icon={<CheckCircle />} label="Concluídos" value={dbOrders.filter(o => o.status === 'delivered').length.toString()} />
                  </div>
                );
              })()}

              <div className="bg-white p-5 lg:p-8 rounded-[2.5rem] lg:rounded-[3rem] shadow-sm border-2 border-gray-50">
                <div className="flex flex-col lg:flex-row justify-between lg:items-center mb-6 lg:mb-8 gap-4">
                  <h3 className="font-black italic text-lg lg:text-xl uppercase tracking-tighter">Performance de Vendas</h3>
                  <div className="bg-gray-50 w-fit px-3 py-1.5 rounded-xl text-[10px] font-black text-gray-400 uppercase tracking-widest">Últimos 7 dias</div>
                </div>
                <div className="h-48 lg:h-72">
                  {(() => {
                    // Generate chart data from real orders
                    const today = new Date();
                    const last7Days = Array.from({ length: 7 }, (_, i) => {
                      const date = new Date(today);
                      date.setDate(date.getDate() - (6 - i));
                      return date;
                    });

                    const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

                    const chartData = last7Days.map(date => {
                      const dayRevenue = dbOrders
                        .filter(order => {
                          if (order.status !== 'delivered') return false;
                          const orderDate = new Date(order.created_at);
                          return orderDate.toDateString() === date.toDateString();
                        })
                        .reduce((sum, order) => sum + order.total, 0);

                      return {
                        name: dayNames[date.getDay()],
                        sales: dayRevenue
                      };
                    });

                    return (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 'bold' }} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 'bold' }} />
                          <Tooltip
                            contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', fontWeight: 'bold' }}
                            formatter={(value: number) => [`R$ ${value.toFixed(2)}`, 'Faturamento']}
                          />
                          <Line type="monotone" dataKey="sales" stroke="#dc2626" strokeWidth={4} dot={{ r: 4, fill: '#dc2626', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    );
                  })()}
                </div>
              </div>
            </>
          )}

          {activeTab === 'orders' && (
            <div className="space-y-10">
              <section className="space-y-6">
                <div className="flex justify-between items-center px-2">
                  <h2 className="text-xl lg:text-2xl font-black text-gray-900 italic tracking-tighter uppercase">Fila de Produção</h2>
                  <div className="bg-red-50 text-red-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                    {dbOrders.filter(o => ['pending', 'confirmed', 'ready', 'accepted'].includes(o.status)).length} Ativos
                  </div>
                </div>

                {dbOrders.length === 0 ? (
                  <div className="bg-white p-12 lg:p-16 rounded-[2.5rem] lg:rounded-[3rem] text-center border-4 border-dashed border-gray-100">
                    <Package size={48} className="mx-auto mb-4 text-gray-200" />
                    <p className="text-gray-400 font-black uppercase tracking-widest text-xs italic">Sem pedidos pendentes...</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
                    {dbOrders.filter(o => !['delivered', 'cancelled'].includes(o.status)).map(order => (
                      <div key={order.id} className="bg-white p-6 lg:p-8 rounded-[2.5rem] lg:rounded-[3rem] shadow-sm border-2 border-gray-50 hover:border-red-200 transition-all group animate-in fade-in zoom-in-95">
                        <div className="flex justify-between items-start mb-6">
                          <div>
                            <p className="text-[10px] font-black text-red-600 uppercase tracking-widest mb-1 italic">#{order.id.slice(0, 8)}</p>
                            <p className="text-gray-900 font-black text-xl lg:text-2xl tracking-tighter">R${order.total.toFixed(2)}</p>
                          </div>
                          <div className={`px-3 lg:px-4 py-1.5 rounded-full text-[9px] lg:text-[10px] font-black uppercase tracking-widest ${statusColors[order.status]}`}>
                            {statusMap[order.status]}
                          </div>
                        </div>

                        <div className="space-y-2 mb-6 bg-gray-50 p-4 rounded-2xl border border-gray-100 shadow-inner">
                          {order.items.map((item, i) => (
                            <div key={i} className="text-xs font-bold flex justify-between">
                              <span className="text-gray-500 uppercase italic truncate max-w-[70%]">{item.product.name}</span>
                              <span className="text-gray-900">x{item.quantity}</span>
                            </div>
                          ))}

                          <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-2 gap-2">
                            <div className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">
                              Criado: <span className="text-gray-600">{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            {order.confirmed_at && (
                              <div className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">
                                Confirmado: <span className="text-gray-600">{new Date(order.confirmed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              </div>
                            )}
                            {order.ready_at && (
                              <div className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">
                                Pronto: <span className="text-gray-600">{new Date(order.ready_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              </div>
                            )}
                            {order.dispatched_at && (
                              <div className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">
                                Saiu: <span className="text-gray-600">{new Date(order.dispatched_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              </div>
                            )}
                            {order.delivered_at && (
                              <div className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">
                                Entregue: <span className="text-gray-600">{new Date(order.delivered_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex gap-2">
                          {order.status === 'pending' && (
                            <button
                              onClick={() => handleUpdateStatus(order.id, 'confirmed')}
                              className="flex-1 bg-gray-900 text-white py-4 rounded-[1.5rem] font-black text-[10px] lg:text-xs uppercase tracking-widest hover:bg-red-600 transition-all flex items-center justify-center gap-3 shadow-xl"
                            >
                              <CheckCircle size={18} /> Confirmar
                            </button>
                          )}
                          {order.status === 'confirmed' && (
                            <button
                              onClick={() => handleUpdateStatus(order.id, 'ready')}
                              className="flex-1 bg-red-600 text-white py-4 rounded-[1.5rem] font-black text-[10px] lg:text-xs uppercase tracking-widest hover:bg-red-700 transition-all flex items-center justify-center gap-3 shadow-xl"
                            >
                              <ChefHat size={18} /> Pronto
                            </button>
                          )}
                          {/* Modified logic for Ready/Accepted states */}
                          {order.status === 'ready' && (
                            <div className="flex-1 bg-blue-50 text-blue-600 py-4 rounded-[1.5rem] font-black text-[10px] lg:text-xs uppercase tracking-widest border border-blue-100 flex items-center justify-center gap-3 animate-pulse">
                              <Loader2 size={18} className="animate-spin" /> Buscando Entregador status...
                            </div>
                          )}
                          {order.status === 'accepted' && (
                            <div className="flex-1 bg-purple-50 text-purple-600 py-4 rounded-[1.5rem] font-black text-[10px] lg:text-xs uppercase tracking-widest border border-purple-100 flex items-center justify-center gap-3">
                              <Clock size={18} /> Entregador a Caminho
                            </div>
                          )}
                          {order.status === 'shipping' && (
                            <div className="flex-1 bg-gray-50 text-gray-400 py-4 rounded-[1.5rem] font-black text-[10px] lg:text-xs uppercase tracking-widest border border-gray-100 flex items-center justify-center gap-3">
                              <Package size={18} /> Em Trânsito
                            </div>
                          )}

                          <button
                            onClick={() => setActiveChatOrder(order)}
                            className="p-4 bg-blue-50 text-blue-600 rounded-[1.5rem] hover:bg-blue-600 hover:text-white transition-all shadow-sm group relative"
                          >
                            <MessageCircle size={18} />
                          </button>

                          <button
                            onClick={() => handleDeleteOrder(order.id)}
                            className="p-4 bg-red-50 text-red-600 rounded-[1.5rem] hover:bg-red-600 hover:text-white transition-all shadow-sm group"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {dbOrders.filter(o => ['delivered', 'cancelled'].includes(o.status)).length > 0 && (
                <section className="space-y-6 opacity-60 grayscale hover:opacity-100 hover:grayscale-0 transition-all">
                  <div className="flex justify-between items-center px-2">
                    <h2 className="text-lg font-black text-gray-400 italic tracking-tighter uppercase flex items-center gap-2">
                      <Archive size={18} /> Histórico Recente
                    </h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {dbOrders.filter(o => ['delivered', 'cancelled'].includes(o.status)).map(order => (
                      <div key={order.id} className="bg-white p-5 rounded-[2rem] border border-gray-100 shadow-sm flex items-center justify-between group">
                        <div>
                          <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest mb-0.5">#{order.id.slice(0, 8)}</p>
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${order.status === 'delivered' ? 'bg-green-500' : 'bg-red-400'}`}></span>
                            <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">{statusMap[order.status]}</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => setActiveChatOrder(order)} className="p-2 text-gray-300 hover:text-blue-500 transition-colors">
                            <MessageCircle size={16} />
                          </button>
                          <button onClick={() => handleDeleteOrder(order.id)} className="p-2 text-gray-300 hover:text-red-500 transition-colors">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}

          {activeTab === 'inventory' && (
            <div className="bg-white rounded-[2.5rem] lg:rounded-[3rem] shadow-sm border-2 border-gray-50 overflow-hidden animate-in fade-in duration-500">
              <div className="p-6 lg:p-8 border-b flex justify-between items-center bg-white">
                <h3 className="font-black italic text-lg lg:text-xl uppercase tracking-tighter">Itens do Cardápio</h3>
                <button
                  onClick={() => setShowNewProductModal(true)}
                  className="bg-gray-900 text-white px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest items-center shadow-lg hover:bg-black transition-all flex"
                >
                  <Plus size={18} className="mr-2" /> Novo Prato
                </button>
              </div>
              <div className="overflow-x-auto no-scrollbar">
                <table className="w-full text-left min-w-[600px]">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-6 lg:px-8 py-4 lg:py-5 text-[9px] lg:text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Imagem</th>
                      <th className="px-6 lg:px-8 py-4 lg:py-5 text-[9px] lg:text-[10px] font-black text-gray-400 uppercase tracking-widest">Produto</th>
                      <th className="px-6 lg:px-8 py-4 lg:py-5 text-[9px] lg:text-[10px] font-black text-gray-400 uppercase tracking-widest">Preço</th>
                      <th className="px-6 lg:px-8 py-4 lg:py-5 text-[9px] lg:text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Gestão</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {loadingProducts ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-12 text-center">
                          <Loader2 size={32} className="animate-spin text-red-600 mx-auto mb-2" />
                          <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Carregando cardápio...</p>
                        </td>
                      </tr>
                    ) : localProducts.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-12 text-center">
                          <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Seu cardápio está vazio</p>
                        </td>
                      </tr>
                    ) : (
                      localProducts.map(product => (
                        <tr key={product.id} className="hover:bg-gray-50 transition-colors group animate-in slide-in-from-left-4">
                          <td className="px-6 lg:px-8 py-5">
                            <img src={product.image} className="w-12 h-12 rounded-xl object-cover shadow-sm group-hover:scale-110 transition-transform" alt="" />
                          </td>
                          <td className="px-6 lg:px-8 py-5">
                            <div className="font-black text-xs lg:text-sm text-gray-900 italic uppercase truncate max-w-[150px]">{product.name}</div>
                            <div className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">{product.category}</div>
                          </td>
                          <td className="px-6 lg:px-8 py-5">
                            <div className="text-xs lg:text-sm font-black text-red-600">R${product.price.toFixed(2)}</div>
                          </td>
                          <td className="px-6 lg:px-8 py-5 text-right">
                            <button
                              onClick={() => handleRemoveProduct(product.id)}
                              className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all shadow-sm"
                            >
                              <Trash2 size={12} /> Remover Item
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-6 animate-in fade-in duration-500">
              <div className="bg-white rounded-[2.5rem] lg:rounded-[3rem] shadow-sm border-2 border-gray-50 p-6 lg:p-8">
                <h3 className="font-black italic text-lg lg:text-xl uppercase tracking-tighter mb-6">Imagem de Destaque</h3>
                <div className="flex flex-col items-center gap-6">
                  <div className="relative w-full max-w-md h-48 rounded-3xl overflow-hidden bg-gray-100 border-2 border-dashed border-gray-200 group">
                    {storeImagePreview ? (
                      <img src={storeImagePreview} className="w-full h-full object-cover" alt="Store Preview" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                        <ImageIcon size={48} />
                        <span className="text-xs font-black uppercase mt-2">Sem Imagem</span>
                      </div>
                    )}
                    <label className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                      <Camera className="text-white" size={32} />
                      <input type="file" className="hidden" accept="image/*" onChange={handleStoreImageChange} />
                    </label>
                  </div>
                  <p className="text-xs font-black text-gray-400 uppercase tracking-widest text-center">Esta imagem será exibida no app do cliente</p>
                  <button
                    onClick={handleUpdateStoreImage}
                    disabled={!storeImageFile || isUploadingStoreImage}
                    className="bg-red-600 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 shadow-xl"
                  >
                    {isUploadingStoreImage ? <Loader2 className="animate-spin" size={18} /> : <Camera size={18} />}
                    {isUploadingStoreImage ? 'Salvando...' : 'Atualizar Imagem'}
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-[2.5rem] lg:rounded-[3rem] shadow-sm border-2 border-gray-50 p-6 lg:p-8">
                <h3 className="font-black italic text-lg lg:text-xl uppercase tracking-tighter mb-6">Informações da Loja</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest px-3">Nome da Loja</label>
                    <p className="text-lg font-black text-gray-900 p-4 bg-gray-50 rounded-xl mt-2">{storeProfile?.full_name || 'Carregando...'}</p>
                  </div>
                  <div>
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest px-3">Categoria</label>
                    <p className="text-lg font-black text-gray-900 p-4 bg-gray-50 rounded-xl mt-2">{storeProfile?.category || 'Não definida'}</p>
                  </div>
                  <div>
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest px-3">Avaliação</label>
                    <p className="text-lg font-black text-gray-900 p-4 bg-gray-50 rounded-xl mt-2">{storeProfile?.rating || 5.0} ⭐</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 lg:hidden bg-white border-t border-gray-100 flex justify-around py-4 z-50 shadow-[0_-10px_30px_rgba(0,0,0,0.05)] rounded-t-[2.5rem]">
        <NavButton icon={<LayoutDashboard />} label="Painel" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
        <NavButton icon={<Package />} label="Pedidos" active={activeTab === 'orders'} onClick={() => setActiveTab('orders')} />
        <NavButton icon={<ShoppingBag />} label="Cardápio" active={activeTab === 'inventory'} onClick={() => setActiveTab('inventory')} />
        <NavButton icon={<Settings />} label="Config" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
      </nav>

      <Modal
        isOpen={!!activeChatOrder}
        onClose={() => setActiveChatOrder(null)}
        title={activeChatOrder ? `Pedido #${activeChatOrder.id.slice(0, 8)}` : ''}
        subtitle="Chat Direto com Cliente"
      >
        <div className="h-[500px] flex flex-col p-4">
          <ChatInterface
            messages={orderMessages}
            onSendMessage={handleSendMessageLocally}
            senderRole="store"
            placeholder="Responda ao cliente..."
          />
        </div>
      </Modal>

      <Modal
        isOpen={showNewProductModal}
        onClose={() => setShowNewProductModal(false)}
        title="Novo Prato"
        subtitle="Adicione um novo item ao seu cardápio"
      >
        <form onSubmit={handleAddProduct} className="p-8 space-y-4">
          <div className="flex flex-col items-center gap-4 mb-4">
            <div className="relative w-32 h-32 rounded-3xl overflow-hidden bg-gray-100 border-2 border-dashed border-gray-200 group">
              {imagePreview ? (
                <img src={imagePreview} className="w-full h-full object-cover" alt="Preview" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                  <ImageIcon size={32} />
                  <span className="text-[8px] font-black uppercase mt-2">Sem Foto</span>
                </div>
              )}
              <label className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                <Camera className="text-white" size={24} />
                <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
              </label>
            </div>
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest text-center">Clique na imagem para subir uma foto</p>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-3">Nome do Prato</label>
            <input required placeholder="Ex: Burger Gourmet" className="w-full bg-gray-50 border-none rounded-xl p-4 font-bold shadow-inner" value={newProduct.name} onChange={e => setNewProduct({ ...newProduct, name: e.target.value })} />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-3">Preço (R$)</label>
            <input required type="number" step="0.01" placeholder="0.00" className="w-full bg-gray-50 border-none rounded-xl p-4 font-bold shadow-inner" value={newProduct.price} onChange={e => setNewProduct({ ...newProduct, price: e.target.value })} />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-3">Categoria</label>
            <select className="w-full bg-gray-50 border-none rounded-xl p-4 font-bold shadow-inner appearance-none" value={newProduct.category} onChange={e => setNewProduct({ ...newProduct, category: e.target.value })}>
              {CATEGORIES.filter(c => c.name !== 'Todos').map(c => (
                <option key={c.name} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-3">Descrição</label>
            <textarea placeholder="Fale um pouco sobre o prato..." className="w-full bg-gray-50 border-none rounded-xl p-4 font-bold shadow-inner h-24" value={newProduct.description} onChange={e => setNewProduct({ ...newProduct, description: e.target.value })} />
          </div>

          <button type="submit" disabled={isUploading} className="w-full py-5 bg-red-600 text-white rounded-[2rem] font-black text-lg shadow-xl shadow-red-100 hover:bg-red-700 active:scale-95 transition-all flex items-center justify-center gap-3">
            {isUploading ? <Loader2 className="animate-spin" /> : <>Criar Prato <Plus size={20} /></>}
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default AdminPanel;
