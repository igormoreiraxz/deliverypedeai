
import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Search,
  ShoppingBag,
  MapPin,
  Star,
  Clock,
  Sparkles,
  MessageCircle,
  User,
  Filter,
  ChevronLeft,
  CreditCard,
  QrCode,
  CheckCircle2,
  ArrowRight,
  Package,
  Send,
  Plus,
  Info,
  Banknote,
  MapPinned,
  ReceiptText,
  Phone,
  X,
  Home,
  Briefcase,
  LocateFixed,
  Zap
} from 'lucide-react';
import { CATEGORIES } from '../constants';
import { getSmartMenuSuggestions } from '../services/gemini';
import { getAllProducts, getProductsByStore } from '../services/products';
import { getRegisteredStores } from '../services/stores';
import { Order, Store, Product, Address, Message } from '../types';
import NavButton from './shared/NavButton';
import AppHeader from './shared/AppHeader';
import Modal from './shared/Modal';
import ChatInterface from './shared/ChatInterface';

interface CustomerAppProps {
  onSwitchMode: () => void;
  onPlaceOrder: (order: Order) => void;
  orders?: Order[];
  messages: Message[];
  onSendMessage: (orderId: string, text: string, sender: 'user' | 'store') => void;
}

type PaymentMethod = 'pix' | 'card' | 'cash';
type ViewState = 'catalog' | 'search' | 'orders' | 'support' | 'checkout' | 'success' | 'store' | 'order-detail';

const CustomerApp: React.FC<CustomerAppProps> = ({ onSwitchMode, onPlaceOrder, orders = [], messages, onSendMessage }) => {
  const [currentView, setCurrentView] = useState<ViewState>('catalog');
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [aiSuggestions, setAiSuggestions] = useState<any[]>([]);
  const [loadingAi, setLoadingAi] = useState(false);
  const [cart, setCart] = useState<any[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pix');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [dbProducts, setDbProducts] = useState<Product[]>([]);
  const [dbStores, setDbStores] = useState<Store[]>([]);
  const [loadingInitial, setLoadingInitial] = useState(true);

  useEffect(() => {
    const initData = async () => {
      const [products, stores] = await Promise.all([
        getAllProducts(),
        getRegisteredStores()
      ]);
      setDbProducts(products);
      setDbStores(stores);
      setLoadingInitial(false);
    };
    initData();
  }, []);

  // Address State
  const [addresses, setAddresses] = useState<Address[]>([
    { id: '1', label: 'Casa', details: 'Av. Paulista, 1578 - Bela Vista', complement: 'Apto 42', type: 'home' },
    { id: '2', label: 'Trabalho', details: 'Rua Amauri, 255 - Itaim Bibi', complement: '8º Andar', type: 'work' },
  ]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('1');
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [isAddingNewAddress, setIsAddingNewAddress] = useState(false);

  // New Address Form State
  const [newAddr, setNewAddr] = useState<Partial<Address>>({ label: '', details: '', complement: '', type: 'home' });

  // Chat State
  const [newMessage, setNewMessage] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const activeAddress = useMemo(() =>
    addresses.find(a => a.id === selectedAddressId) || addresses[0]
    , [addresses, selectedAddressId]);

  const currentOrderMessages = useMemo(() => {
    if (!viewingOrder) return [];
    return messages.filter(m => m.orderId === viewingOrder.id);
  }, [messages, viewingOrder]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [currentOrderMessages]);

  const detectLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocalização não é suportada pelo seu navegador.");
      return;
    }

    setIsDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setTimeout(() => {
          setNewAddr(prev => ({
            ...prev,
            details: `Latitude: ${position.coords.latitude.toFixed(4)}, Longitude: ${position.coords.longitude.toFixed(4)} (Localização Detectada)`,
            label: 'Localização Atual'
          }));
          setIsDetectingLocation(false);
        }, 1500);
      },
      (error) => {
        setIsDetectingLocation(false);
        alert("Não foi possível obter sua localização. Por favor, digite manualmente.");
      }
    );
  };

  const handleAskAi = async () => {
    if (!searchTerm) return;
    setLoadingAi(true);
    const suggestions = await getSmartMenuSuggestions(searchTerm);
    setAiSuggestions(suggestions);
    setLoadingAi(false);
  };

  const addToCart = (product: Product) => {
    setCart(prev => [...prev, product]);
  };

  const removeFromCart = (index: number) => {
    setCart(prev => prev.filter((_, i) => i !== index));
  };

  const handleSendMessage = () => {
    if (!newMessage.trim() || !viewingOrder) return;
    onSendMessage(viewingOrder.id, newMessage, 'user');
    setNewMessage('');
  };

  const handlePlaceOrder = () => {
    setIsProcessing(true);
    const newOrder: Order = {
      id: `PA-${Math.floor(Math.random() * 90000) + 10000}`,
      customerId: 'user-123',
      items: cart.map(p => ({ product: p, quantity: 1 })),
      status: 'pending',
      total: cart.reduce((acc, curr) => acc + curr.price, 0),
      createdAt: new Date().toISOString(),
      address: `${activeAddress.details}${activeAddress.complement ? ', ' + activeAddress.complement : ''}`
    };

    setTimeout(() => {
      onPlaceOrder(newOrder);
      setIsProcessing(false);
      setCurrentView('success');
      setCart([]);
    }, 1500);
  };

  const addNewAddress = (e: React.FormEvent) => {
    e.preventDefault();
    const id = Date.now().toString();
    const added: Address = {
      id,
      label: newAddr.label || 'Outro',
      details: newAddr.details || '',
      complement: newAddr.complement || '',
      type: newAddr.type || 'other'
    };
    setAddresses(prev => [...prev, added]);
    setSelectedAddressId(id);
    setIsAddingNewAddress(false);
    setNewAddr({ label: '', details: '', complement: '', type: 'home' });
  };

  const filteredStores = useMemo(() => {
    return dbStores.filter(store => {
      const matchesCategory = selectedCategory === 'Todos' || store.category === selectedCategory;
      const matchesSearch = store.name.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchTerm, dbStores]);

  const openStore = (store: Store) => {
    setSelectedStore(store);
    setCurrentView('store');
    window.scrollTo(0, 0);
  };

  const openOrderDetail = (order: Order) => {
    setViewingOrder(order);
    setCurrentView('order-detail');
    window.scrollTo(0, 0);
  };

  const startHelpChat = () => {
    setCurrentView('support');
    window.scrollTo(0, 0);
  };

  const total = cart.reduce((acc, curr) => acc + curr.price, 0);

  // --- MODAL COMPONENT ---
  const AddressModal = () => (
    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-md rounded-t-[3rem] sm:rounded-[3rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-10 duration-500">
        <div className="p-8 border-b border-gray-50 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-black italic uppercase tracking-tighter text-gray-900">
              {isAddingNewAddress ? 'Novo Endereço' : 'Seus Locais'}
            </h2>
            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-1">
              {isAddingNewAddress ? 'Complete as informações de entrega' : 'Onde entregamos hoje?'}
            </p>
          </div>
          <button
            onClick={() => { setShowAddressModal(false); setIsAddingNewAddress(false); }}
            className="p-3 bg-gray-50 text-gray-400 hover:text-red-600 rounded-2xl transition-all"
          >
            <X size={24} />
          </button>
        </div>

        {isAddingNewAddress ? (
          <form onSubmit={addNewAddress} className="p-8 space-y-6">
            <button
              type="button"
              onClick={detectLocation}
              disabled={isDetectingLocation}
              className="w-full bg-red-50 text-red-600 p-4 rounded-2xl border-2 border-red-100 flex items-center justify-center gap-2 font-black text-xs uppercase tracking-widest active:scale-95 transition-all"
            >
              {isDetectingLocation ? <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" /> : <LocateFixed size={18} />}
              {isDetectingLocation ? 'Buscando sinal...' : 'Usar minha localização atual'}
            </button>

            <div className="space-y-3">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-3">Apelido (ex: Casa do João)</label>
              <input
                required
                className="w-full bg-gray-50 border-none rounded-[1.5rem] px-6 py-4 text-sm font-bold focus:ring-4 focus:ring-red-500/10 shadow-inner"
                value={newAddr.label}
                onChange={e => setNewAddr({ ...newAddr, label: e.target.value })}
                placeholder="Nomeie este local"
              />
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-3">Endereço</label>
              <div className="relative">
                <input
                  required
                  className="w-full bg-gray-50 border-none rounded-[1.5rem] pl-14 pr-6 py-4 text-sm font-bold focus:ring-4 focus:ring-red-500/10 shadow-inner"
                  value={newAddr.details}
                  onChange={e => setNewAddr({ ...newAddr, details: e.target.value })}
                  placeholder="Rua, número e bairro"
                />
                <MapPin className="absolute left-6 top-4 text-red-500" size={18} />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-3">Complemento / Apto</label>
              <input
                className="w-full bg-gray-50 border-none rounded-[1.5rem] px-6 py-4 text-sm font-bold focus:ring-4 focus:ring-red-500/10 shadow-inner"
                value={newAddr.complement}
                onChange={e => setNewAddr({ ...newAddr, complement: e.target.value })}
                placeholder="Opcional"
              />
            </div>

            <div className="flex gap-4">
              {(['home', 'work', 'other'] as const).map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setNewAddr({ ...newAddr, type })}
                  className={`flex-1 py-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${newAddr.type === type ? 'border-red-600 bg-red-50 text-red-600' : 'border-gray-100 bg-white text-gray-400'}`}
                >
                  {type === 'home' ? <Home size={18} /> : type === 'work' ? <Briefcase size={18} /> : <MapPin size={18} />}
                  <span className="text-[9px] font-black uppercase tracking-widest">{type === 'home' ? 'Casa' : type === 'work' ? 'Trampo' : 'Outro'}</span>
                </button>
              ))}
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={() => setIsAddingNewAddress(false)}
                className="flex-1 bg-gray-100 text-gray-500 py-5 rounded-[2rem] font-black text-xs uppercase tracking-widest"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-[2] bg-red-600 text-white py-5 rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-xl shadow-red-100"
              >
                Adicionar Local
              </button>
            </div>
          </form>
        ) : (
          <div className="p-8 space-y-4">
            <div className="space-y-3 max-h-80 overflow-y-auto no-scrollbar pr-1">
              {addresses.map(addr => (
                <button
                  key={addr.id}
                  onClick={() => { setSelectedAddressId(addr.id); setShowAddressModal(false); }}
                  className={`w-full text-left p-6 rounded-[2.5rem] border-2 transition-all flex items-center gap-5 ${selectedAddressId === addr.id ? 'border-red-600 bg-red-50' : 'border-gray-50 bg-white hover:border-gray-200'}`}
                >
                  <div className={`w-14 h-14 rounded-[1.5rem] flex items-center justify-center shrink-0 ${selectedAddressId === addr.id ? 'bg-red-600 text-white shadow-lg shadow-red-200' : 'bg-gray-100 text-gray-400'}`}>
                    {addr.type === 'home' ? <Home size={24} /> : addr.type === 'work' ? <Briefcase size={24} /> : <MapPin size={24} />}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-black italic text-gray-900 uppercase text-sm">{addr.label}</h4>
                    <p className="text-xs text-gray-500 font-medium truncate">{addr.details}</p>
                    <p className="text-[10px] text-gray-400 font-bold uppercase">{addr.complement}</p>
                  </div>
                  {selectedAddressId === addr.id && <CheckCircle2 size={24} className="text-red-600" />}
                </button>
              ))}
            </div>

            <button
              onClick={() => setIsAddingNewAddress(true)}
              className="w-full mt-4 flex items-center justify-center gap-3 p-6 border-4 border-dashed border-gray-100 rounded-[2.5rem] text-gray-400 hover:border-red-200 hover:text-red-600 transition-all font-black uppercase text-xs tracking-widest"
            >
              <Plus size={20} /> Adicionar Novo Endereço
            </button>
          </div>
        )}
      </div>
    </div>
  );

  // --- COMPONENTES DE TELA ---

  const CatalogView = () => (
    <main className="p-4 space-y-6 animate-in fade-in duration-300">
      <section className="-mx-4 px-4 overflow-x-auto no-scrollbar flex gap-3 py-2">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.name}
            onClick={() => setSelectedCategory(cat.name)}
            className={`flex flex-col items-center min-w-[70px] transition-all p-2 rounded-2xl ${selectedCategory === cat.name ? 'bg-red-50 ring-2 ring-red-500 scale-105' : 'bg-white'
              }`}
          >
            <span className="text-2xl mb-1">{cat.icon}</span>
            <span className={`text-[10px] font-bold ${selectedCategory === cat.name ? 'text-red-600' : 'text-gray-500'}`}>{cat.name}</span>
          </button>
        ))}
      </section>

      {aiSuggestions.length > 0 && (
        <section className="bg-gradient-to-br from-red-600 to-orange-500 p-5 rounded-[2rem] shadow-xl text-white overflow-hidden relative">
          <div className="relative z-10">
            <div className="flex items-center mb-4 font-bold text-lg">
              <Sparkles size={20} className="mr-2" /> Dicas da IA
            </div>
            <div className="space-y-4">
              {aiSuggestions.map((s, i) => (
                <div key={i} className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 hover:bg-white/20 transition-colors cursor-pointer">
                  <div className="font-bold">{s.name}</div>
                  <div className="text-xs text-white/80 line-clamp-2">{s.description}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section>
        <h2 className="text-xl font-black text-gray-900 mb-4 tracking-tight">Perto de você</h2>
        <div className="space-y-6">
          {filteredStores.map(store => (
            <div key={store.id} onClick={() => openStore(store)} className="group cursor-pointer">
              <div className="relative h-48 w-full overflow-hidden rounded-[2.5rem] mb-3 shadow-lg group-active:scale-[0.98] transition-all">
                <img src={store.image} alt={store.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-2xl text-xs font-black flex items-center shadow-lg">
                  <Star size={14} className="text-yellow-500 mr-1 fill-yellow-500" /> {store.rating}
                </div>
                <div className="absolute bottom-4 left-4">
                  <div className="bg-black/40 backdrop-blur-md text-white px-3 py-1.5 rounded-2xl text-xs font-bold flex items-center">
                    <Clock size={12} className="mr-1" /> {store.deliveryTime}
                  </div>
                </div>
              </div>
              <h3 className="font-black text-lg text-gray-900 ml-1">{store.name}</h3>
              <p className="text-xs text-gray-400 font-bold ml-1 uppercase tracking-widest">{store.category} • Frete Grátis</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );

  const StoreView = () => {
    if (!selectedStore) return null;
    const storeMenu = dbProducts.filter(p => (p as any).store_id === selectedStore.id);

    return (
      <main className="animate-in slide-in-from-right-10 duration-500 pb-20">
        <div className="relative h-64 w-full">
          <img src={selectedStore.image} className="w-full h-full object-cover" alt={selectedStore.name} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <button
            onClick={() => setCurrentView('catalog')}
            className="absolute top-4 left-4 p-3 bg-white/20 backdrop-blur-md text-white rounded-2xl hover:bg-white/40 transition-all"
          >
            <ChevronLeft size={24} />
          </button>
        </div>

        <div className="bg-white -mt-10 rounded-t-[3rem] relative px-6 pt-8 space-y-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-black text-gray-900 tracking-tighter">{selectedStore.name}</h1>
              <div className="flex items-center gap-3 mt-2">
                <span className="flex items-center text-sm font-black text-yellow-600 bg-yellow-50 px-2 py-1 rounded-lg">
                  <Star size={14} className="mr-1 fill-yellow-600" /> {selectedStore.rating}
                </span>
                <span className="text-sm font-bold text-gray-400 uppercase tracking-widest">{selectedStore.category}</span>
              </div>
            </div>
            <button className="p-3 bg-gray-50 text-gray-400 rounded-2xl">
              <Info size={24} />
            </button>
          </div>

          <section className="space-y-6">
            <h2 className="text-xl font-black text-gray-900">Cardápio</h2>
            <div className="space-y-4">
              {storeMenu.map(product => (
                <div key={product.id} className="flex gap-4 p-4 border-2 border-gray-50 rounded-[2rem] hover:border-red-50 transition-all group">
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-900">{product.name}</h4>
                    <p className="text-xs text-gray-400 mt-1 line-clamp-2">{product.description}</p>
                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-red-600 font-black">R$ {product.price.toFixed(2)}</span>
                      <button
                        onClick={() => addToCart(product)}
                        className="p-2 bg-gray-900 text-white rounded-xl active:scale-90 transition-transform hover:bg-red-600"
                      >
                        <Plus size={18} />
                      </button>
                    </div>
                  </div>
                  <div className="w-24 h-24 rounded-2xl overflow-hidden shrink-0">
                    <img src={product.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="" />
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
    );
  };

  const OrdersView = () => {
    const statusMap: any = {
      pending: { label: 'Pendente', color: 'text-orange-500 bg-orange-50' },
      confirmed: { label: 'Preparando', color: 'text-blue-500 bg-blue-50' },
      ready: { label: 'Pronto p/ Coleta', color: 'text-blue-600 bg-blue-50' },
      shipping: { label: 'Em Entrega', color: 'text-purple-500 bg-purple-50' },
      delivered: { label: 'Entregue', color: 'text-green-500 bg-green-50' },
      cancelled: { label: 'Cancelado', color: 'text-red-500 bg-red-50' }
    };

    return (
      <main className="p-4 space-y-6 animate-in fade-in duration-300">
        <h2 className="text-2xl font-black mb-6">Meus Pedidos</h2>
        {orders.length === 0 ? (
          <div className="text-center py-20">
            <div className="bg-gray-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package size={32} className="text-gray-300" />
            </div>
            <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Você não tem pedidos ativos</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map(order => (
              <div key={order.id} className="bg-white p-6 rounded-[2rem] border-2 border-gray-50 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Pedido {order.id}</span>
                    <h3 className="font-black text-gray-900">R$ {order.total.toFixed(2)}</h3>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${statusMap[order.status].color}`}>
                    {statusMap[order.status].label}
                  </div>
                </div>
                <div className="text-xs text-gray-500 mb-4 font-medium italic">
                  {order.items.map(i => i.product.name).join(', ')}
                </div>
                <button
                  onClick={() => openOrderDetail(order)}
                  className="w-full py-3 border-2 border-gray-100 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-gray-50 transition-colors"
                >
                  Ver Detalhes / Chat
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    );
  };

  const OrderDetailView = () => {
    if (!viewingOrder) return null;

    const statusMap: any = {
      pending: { label: 'Aguardando Aprovação', step: 1, color: 'text-orange-500' },
      confirmed: { label: 'Em Preparação', step: 2, color: 'text-orange-600' },
      ready: { label: 'Pronto para Coleta', step: 3, color: 'text-blue-500' },
      shipping: { label: 'Saiu para Entrega', step: 4, color: 'text-purple-500' },
      delivered: { label: 'Pedido Entregue', step: 5, color: 'text-green-500' },
      cancelled: { label: 'Pedido Cancelado', step: 0, color: 'text-red-500' }
    };

    const currentStatus = statusMap[viewingOrder.status];
    const canChat = ['confirmed', 'ready', 'shipping'].includes(viewingOrder.status);

    return (
      <main className="animate-in slide-in-from-right-10 duration-300 min-h-screen pb-20">
        <header className="p-4 border-b flex items-center bg-white sticky top-0 z-10">
          <button onClick={() => setCurrentView('orders')} className="p-2 -ml-2 hover:bg-gray-100 rounded-full">
            <ChevronLeft size={24} />
          </button>
          <div className="ml-2">
            <h1 className="text-sm font-black text-gray-400 uppercase tracking-widest leading-none">Pedido</h1>
            <p className="text-lg font-black text-gray-900">{viewingOrder.id}</p>
          </div>
        </header>

        <div className="p-6 space-y-8">
          {/* Status Tracker */}
          <section className="bg-gray-50 p-6 rounded-[2.5rem] border border-gray-100">
            <h2 className={`font-black text-xl mb-4 ${currentStatus.color}`}>{currentStatus.label}</h2>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((step) => (
                <div
                  key={step}
                  className={`h-2 flex-1 rounded-full transition-all duration-700 ${step <= currentStatus.step ? 'bg-red-600 shadow-[0_0_10px_rgba(220,38,38,0.4)]' : 'bg-gray-200'
                    }`}
                />
              ))}
            </div>
            {canChat && (
              <button
                onClick={startHelpChat}
                className="mt-6 w-full py-4 bg-white text-gray-900 border-2 border-gray-100 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-gray-50"
              >
                <MessageCircle size={18} className="text-red-600" /> Conversar com a Loja
              </button>
            )}
          </section>

          {/* Resumo */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <ReceiptText size={18} className="text-gray-400" />
              <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest">Resumo dos Itens</h2>
            </div>
            <div className="bg-white rounded-[2rem] border-2 border-gray-50 overflow-hidden">
              {viewingOrder.items.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center p-4 border-b border-gray-50 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-xs font-black text-gray-400">
                      {item.quantity}x
                    </div>
                    <p className="font-bold text-gray-900 text-sm">{item.product.name}</p>
                  </div>
                  <span className="font-black text-sm text-gray-900">R$ {(item.product.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </section>

          <button
            onClick={startHelpChat}
            className="w-full py-5 bg-gray-900 text-white rounded-[2rem] font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl hover:bg-black transition-all"
          >
            Suporte PedeAí <MessageCircle size={18} />
          </button>
        </div>
      </main>
    );
  };

  const SupportView = () => {
    const chatStore = viewingOrder
      ? dbStores.find(s => s.id === (viewingOrder as any).storeId) || dbStores[0]
      : dbStores[0];

    return (
      <main className="flex flex-col h-screen bg-white animate-in slide-in-from-bottom-10 duration-500 fixed inset-0 z-50">
        <AppHeader
          title={chatStore.name}
          subtitle="Loja Aberta"
          showLogo={false}
          rightElement={<button className="p-2 text-gray-400"><Phone size={20} /></button>}
          onLogoClick={() => setCurrentView('order-detail')}
        />

        <ChatInterface
          messages={currentOrderMessages}
          onSendMessage={(text) => viewingOrder && onSendMessage(viewingOrder.id, text, 'user')}
          senderRole="user"
          placeholder="Escreva para a loja..."
        />
      </main>
    );
  };

  const SearchView = () => (
    <main className="p-4 space-y-6 animate-in slide-in-from-bottom-4 duration-300">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-black">Explorar</h2>
        <Filter size={20} className="text-gray-400" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        {dbProducts.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase())).map(product => (
          <div key={product.id} className="bg-white border-2 border-gray-50 rounded-[2rem] p-4 flex flex-col shadow-sm">
            <div className="relative mb-3 overflow-hidden rounded-2xl h-32">
              <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
            </div>
            <h4 className="font-bold text-sm text-gray-900 line-clamp-1">{product.name}</h4>
            <div className="mt-auto flex justify-between items-center">
              <span className="text-red-600 font-black">R${product.price.toFixed(2)}</span>
              <button onClick={() => addToCart(product)} className="p-2 bg-gray-900 text-white rounded-xl hover:bg-red-600"><Plus size={16} /></button>
            </div>
          </div>
        ))}
      </div>
    </main>
  );

  if (currentView === 'success') {
    return (
      <div className="max-w-md mx-auto bg-white min-h-screen flex flex-col items-center justify-center p-8 text-center animate-in zoom-in-95 duration-500">
        <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6 shadow-xl shadow-green-100">
          <CheckCircle2 size={56} className="animate-bounce" />
        </div>
        <h1 className="text-3xl font-black text-gray-900 mb-2">Pedido Confirmado!</h1>
        <p className="text-gray-500 mb-8 font-medium">Seu pedido foi enviado para a loja e será preparado em breve.</p>
        <button onClick={() => setCurrentView('orders')} className="w-full bg-gray-900 text-white py-5 rounded-[2rem] font-black text-lg shadow-xl hover:bg-black transition-all">
          Acompanhar Pedido
        </button>
        <button onClick={() => setCurrentView('catalog')} className="mt-4 text-gray-400 font-bold text-sm uppercase tracking-widest">
          Voltar ao Início
        </button>
      </div>
    );
  }

  if (currentView === 'checkout') {
    return (
      <div className="max-w-md mx-auto bg-white min-h-screen pb-32 animate-in slide-in-from-right-10 duration-300">
        <header className="p-4 border-b flex items-center bg-white sticky top-0 z-10">
          <button onClick={() => setCurrentView('catalog')} className="p-2 -ml-2 hover:bg-gray-100 rounded-full">
            <ChevronLeft size={24} />
          </button>
          <h1 className="ml-2 text-xl font-black">Finalizar Pedido</h1>
        </header>
        <main className="p-6 space-y-8">
          <section>
            <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4">Seus Itens</h2>
            <div className="space-y-4">
              {cart.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between group">
                  <div className="flex items-center gap-4">
                    <img src={item.image} className="w-14 h-14 rounded-2xl object-cover shadow-sm" alt="" />
                    <div>
                      <p className="font-bold text-gray-900">{item.name}</p>
                      <p className="text-xs text-red-600 font-black">R${item.price.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-gray-50 p-6 rounded-[2.5rem] border border-gray-100">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest">Endereço de Entrega</h2>
              <button onClick={() => setShowAddressModal(true)} className="text-red-600 text-xs font-bold">Alterar Local</button>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-red-600 text-white rounded-xl flex items-center justify-center shrink-0">
                {activeAddress.type === 'home' ? <Home size={18} /> : activeAddress.type === 'work' ? <Briefcase size={18} /> : <MapPin size={18} />}
              </div>
              <div>
                <p className="font-bold text-gray-900">{activeAddress.label}</p>
                <p className="text-xs text-gray-500 font-medium italic">
                  {activeAddress.details}{activeAddress.complement ? ` - ${activeAddress.complement}` : ''}
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Forma de Pagamento</h2>
            <div className="grid grid-cols-3 gap-3">
              {(['pix', 'card', 'cash'] as const).map(m => (
                <button
                  key={m}
                  onClick={() => setPaymentMethod(m)}
                  className={`p-4 rounded-[2rem] border-2 transition-all flex flex-col items-center gap-2 group ${paymentMethod === m ? 'border-red-600 bg-red-50 text-red-600' : 'border-gray-100 text-gray-300 hover:border-gray-300'}`}
                >
                  <div className={`p-3 rounded-2xl ${paymentMethod === m ? 'bg-red-100' : 'bg-gray-50'}`}>
                    {m === 'pix' ? <QrCode size={20} /> : m === 'card' ? <CreditCard size={20} /> : <Banknote size={20} />}
                  </div>
                  <span className="font-black text-[9px] uppercase tracking-tighter">{m === 'pix' ? 'PIX' : m === 'card' ? 'Cartão' : 'Dinheiro'}</span>
                </button>
              ))}
            </div>
          </section>

          <section className="pt-4 border-t border-dashed">
            <div className="flex justify-between text-xl pt-4 border-t border-gray-100">
              <span className="font-black text-gray-900">Total</span>
              <span className="font-black text-red-600">R${total.toFixed(2)}</span>
            </div>
          </section>
        </main>

        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md p-6 bg-white border-t border-gray-100 z-20 shadow-2xl rounded-t-[2.5rem]">
          <button onClick={handlePlaceOrder} disabled={isProcessing} className={`w-full py-5 rounded-[2rem] font-black text-lg flex items-center justify-center gap-3 transition-all shadow-xl shadow-red-100 ${isProcessing ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-red-600 text-white hover:bg-red-700 active:scale-[0.98]'}`}>
            {isProcessing ? <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin" /> : <>Finalizar Pedido <ArrowRight size={20} /></>}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-white min-h-screen shadow-lg pb-24">
      {currentView !== 'store' && currentView !== 'order-detail' && currentView !== 'support' && (
        <>
          <AppHeader
            showLogo={true}
            onLogoClick={() => setCurrentView('catalog')}
            rightElement={
              <div className="flex items-center gap-3">
                <button onClick={() => setShowAddressModal(true)} className="flex items-center text-sm font-semibold text-gray-700 bg-gray-100 px-3 py-1.5 rounded-full hover:bg-gray-200 transition-colors">
                  <MapPin size={14} className="mr-1 text-red-600" />
                  <span className="max-w-[120px] truncate">{activeAddress.label}</span>
                </button>
                <button onClick={onSwitchMode} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors">
                  <User size={18} className="text-gray-600" />
                </button>
              </div>
            }
          />

          <div className="p-4 bg-white sticky top-[73px] z-10 border-b">
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar por lojas ou pratos..."
                className="w-full pl-10 pr-12 py-3.5 bg-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500 transition-all border-none"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  if (currentView !== 'search' && currentView !== 'store') setCurrentView('search');
                }}
              />
              <Search className="absolute left-3.5 top-4 text-gray-400" size={18} />
              <button onClick={handleAskAi} className={`absolute right-2 top-2 p-2 rounded-xl transition-all ${loadingAi ? 'bg-gray-200 animate-pulse' : 'bg-red-500 hover:bg-red-600'} text-white shadow-lg`}>
                {loadingAi ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Sparkles size={18} />}
              </button>
            </div>
          </div>
        </>
      )}

      {currentView === 'catalog' && <CatalogView />}
      {currentView === 'search' && <SearchView />}
      {currentView === 'orders' && <OrdersView />}
      {currentView === 'store' && <StoreView />}
      {currentView === 'order-detail' && <OrderDetailView />}
      {currentView === 'support' && <SupportView />}

      <Modal
        isOpen={showAddressModal}
        onClose={() => { setShowAddressModal(false); setIsAddingNewAddress(false); }}
        title={isAddingNewAddress ? 'Novo Endereço' : 'Seus Locais'}
        subtitle={isAddingNewAddress ? 'Complete as informações de entrega' : 'Onde entregamos hoje?'}
      >
        {isAddingNewAddress ? (
          <form onSubmit={addNewAddress} className="p-8 space-y-6">
            <button
              type="button"
              onClick={detectLocation}
              disabled={isDetectingLocation}
              className="w-full bg-red-50 text-red-600 p-4 rounded-2xl border-2 border-red-100 flex items-center justify-center gap-2 font-black text-xs uppercase tracking-widest active:scale-95 transition-all"
            >
              {isDetectingLocation ? <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" /> : <LocateFixed size={18} />}
              {isDetectingLocation ? 'Buscando sinal...' : 'Usar minha localização atual'}
            </button>

            <div className="space-y-3">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-3">Apelido (ex: Casa do João)</label>
              <input
                required
                className="w-full bg-gray-50 border-none rounded-[1.5rem] px-6 py-4 text-sm font-bold focus:ring-4 focus:ring-red-500/10 shadow-inner"
                value={newAddr.label}
                onChange={e => setNewAddr({ ...newAddr, label: e.target.value })}
                placeholder="Nomeie este local"
              />
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-3">Endereço</label>
              <div className="relative">
                <input
                  required
                  className="w-full bg-gray-50 border-none rounded-[1.5rem] pl-14 pr-6 py-4 text-sm font-bold focus:ring-4 focus:ring-red-500/10 shadow-inner"
                  value={newAddr.details}
                  onChange={e => setNewAddr({ ...newAddr, details: e.target.value })}
                  placeholder="Rua, número e bairro"
                />
                <MapPin className="absolute left-6 top-4 text-red-500" size={18} />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-3">Complemento / Apto</label>
              <input
                className="w-full bg-gray-50 border-none rounded-[1.5rem] px-6 py-4 text-sm font-bold focus:ring-4 focus:ring-red-500/10 shadow-inner"
                value={newAddr.complement}
                onChange={e => setNewAddr({ ...newAddr, complement: e.target.value })}
                placeholder="Opcional"
              />
            </div>

            <div className="flex gap-4">
              {(['home', 'work', 'other'] as const).map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setNewAddr({ ...newAddr, type })}
                  className={`flex-1 py-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${newAddr.type === type ? 'border-red-600 bg-red-50 text-red-600' : 'border-gray-100 bg-white text-gray-400'}`}
                >
                  {type === 'home' ? <Home size={18} /> : type === 'work' ? <Briefcase size={18} /> : <MapPin size={18} />}
                  <span className="text-[9px] font-black uppercase tracking-widest">{type === 'home' ? 'Casa' : type === 'work' ? 'Trampo' : 'Outro'}</span>
                </button>
              ))}
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={() => setIsAddingNewAddress(false)}
                className="flex-1 bg-gray-100 text-gray-500 py-5 rounded-[2rem] font-black text-xs uppercase tracking-widest"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-[2] bg-red-600 text-white py-5 rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-xl shadow-red-100"
              >
                Adicionar Local
              </button>
            </div>
          </form>
        ) : (
          <div className="p-8 space-y-4">
            <div className="space-y-3 max-h-80 overflow-y-auto no-scrollbar pr-1">
              {addresses.map(addr => (
                <button
                  key={addr.id}
                  onClick={() => { setSelectedAddressId(addr.id); setShowAddressModal(false); }}
                  className={`w-full text-left p-6 rounded-[2.5rem] border-2 transition-all flex items-center gap-5 ${selectedAddressId === addr.id ? 'border-red-600 bg-red-50' : 'border-gray-50 bg-white hover:border-gray-200'}`}
                >
                  <div className={`w-14 h-14 rounded-[1.5rem] flex items-center justify-center shrink-0 ${selectedAddressId === addr.id ? 'bg-red-600 text-white shadow-lg shadow-red-200' : 'bg-gray-100 text-gray-400'}`}>
                    {addr.type === 'home' ? <Home size={24} /> : addr.type === 'work' ? <Briefcase size={24} /> : <MapPin size={24} />}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-black italic text-gray-900 uppercase text-sm">{addr.label}</h4>
                    <p className="text-xs text-gray-500 font-medium truncate">{addr.details}</p>
                    <p className="text-[10px] text-gray-400 font-bold uppercase">{addr.complement}</p>
                  </div>
                  {selectedAddressId === addr.id && <CheckCircle2 size={24} className="text-red-600" />}
                </button>
              ))}
            </div>

            <button
              onClick={() => setIsAddingNewAddress(true)}
              className="w-full mt-4 flex items-center justify-center gap-3 p-6 border-4 border-dashed border-gray-100 rounded-[2.5rem] text-gray-400 hover:border-red-200 hover:text-red-600 transition-all font-black uppercase text-xs tracking-widest"
            >
              <Plus size={20} /> Adicionar Novo Endereço
            </button>
          </div>
        )}
      </Modal>

      {cart.length > 0 && !['checkout', 'success', 'order-detail', 'support'].includes(currentView) && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 w-full max-w-xs px-4 animate-in slide-in-from-bottom-10 z-40">
          <button
            onClick={() => setCurrentView('checkout')}
            className="w-full bg-red-600 text-white py-4 rounded-3xl font-black shadow-[0_20px_50px_rgba(220,38,38,0.3)] flex justify-between px-8 hover:bg-red-700 transition-all transform active:scale-95"
          >
            <span className="flex items-center"><ShoppingBag size={20} className="mr-2" /> {cart.length} itens</span>
            <span>R${total.toFixed(2)}</span>
          </button>
        </div>
      )}

      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white border-t border-gray-100 flex justify-around py-4 z-30 shadow-[0_-10px_30px_rgba(0,0,0,0.05)] rounded-t-[2.5rem]">
        <NavButton icon={<ShoppingBag />} label="Explorar" active={currentView === 'catalog' || currentView === 'store'} onClick={() => setCurrentView('catalog')} />
        <NavButton icon={<Search />} label="Buscar" active={currentView === 'search'} onClick={() => setCurrentView('search')} />
        <NavButton icon={<Clock />} label="Pedidos" active={currentView === 'orders'} onClick={() => setCurrentView('orders')} />
        <NavButton icon={<MessageCircle />} label="Suporte" active={currentView === 'support'} onClick={() => setCurrentView('support')} />
      </nav>
    </div>
  );
};

export default CustomerApp;
