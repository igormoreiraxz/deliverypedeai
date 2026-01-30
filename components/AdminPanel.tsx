
import React, { useState, useRef, useEffect } from 'react';
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
  Zap
} from 'lucide-react';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { MOCK_PRODUCTS, CATEGORIES } from '../constants';
import { Order, Product, Message } from '../types';
import NavButton from './shared/NavButton';
import AppHeader from './shared/AppHeader';
import Modal from './shared/Modal';
import ChatInterface from './shared/ChatInterface';

interface AdminPanelProps {
  onSwitchMode: () => void;
  orders: Order[];
  onUpdateOrder: (id: string, status: Order['status']) => void;
  onDeleteOrder: (id: string) => void;
  messages: Message[];
  onSendMessage: (orderId: string, text: string, sender: 'user' | 'store') => void;
}

const chartData = [
  { name: 'Seg', sales: 4000 },
  { name: 'Ter', sales: 3000 },
  { name: 'Qua', sales: 2000 },
  { name: 'Qui', sales: 2780 },
  { name: 'Sex', sales: 1890 },
  { name: 'Sáb', sales: 2390 },
  { name: 'Dom', sales: 3490 },
];

const AdminPanel: React.FC<AdminPanelProps> = ({ onSwitchMode, orders, onUpdateOrder, onDeleteOrder, messages, onSendMessage }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showNewProductModal, setShowNewProductModal] = useState(false);
  const [activeChatOrder, setActiveChatOrder] = useState<Order | null>(null);
  const [localProducts, setLocalProducts] = useState<Product[]>(MOCK_PRODUCTS);

  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    price: '',
    category: CATEGORIES[1].name,
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80'
  });

  const handleRemoveProduct = (id: string) => {
    if (confirm('Deseja realmente excluir este item do cardápio permanentemente?')) {
      setLocalProducts(prev => prev.filter(p => p.id !== id));
    }
  };

  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    const productToAdd: Product = {
      id: `p${Date.now()}`,
      name: newProduct.name,
      description: newProduct.description,
      price: parseFloat(newProduct.price),
      category: newProduct.category,
      image: newProduct.image
    };

    setLocalProducts(prev => [productToAdd, ...prev]);
    setShowNewProductModal(false);
    setNewProduct({
      name: '',
      description: '',
      price: '',
      category: CATEGORIES[1].name,
      image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80'
    });
  };

  const activeOrders = orders.filter(o => ['pending', 'confirmed', 'ready'].includes(o.status));
  const historyOrders = orders.filter(o => ['delivered', 'cancelled', 'shipping'].includes(o.status));

  const statusMap: any = {
    pending: 'Pendente',
    confirmed: 'Em Preparo',
    ready: 'Pronto',
    shipping: 'Em Entrega',
    delivered: 'Entregue',
    cancelled: 'Cancelado'
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-gray-50">
      {/* Sidebar Desktop */}
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
              {activeOrders.filter(o => o.status === 'pending').length > 0 && <span className="absolute -top-1 -right-1 bg-red-600 w-2.5 h-2.5 rounded-full border-2 border-white"></span>}
            </div>
            Pedidos
          </button>
          <button onClick={() => setActiveTab('inventory')} className={`w-full flex items-center p-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'inventory' ? 'bg-red-50 text-red-600 shadow-sm' : 'text-gray-400 hover:bg-gray-100'}`}>
            <ShoppingBag className="mr-3" size={20} /> Cardápio
          </button>
        </nav>

        <div className="p-4 border-t space-y-2">
          <button onClick={onSwitchMode} className="w-full flex items-center p-4 rounded-2xl text-xs font-black uppercase tracking-widest text-red-600 hover:bg-red-50 transition-colors">
            <LogOut className="mr-3" size={20} /> Sair do Painel
          </button>
        </div>
      </aside>

      {/* Conteúdo Principal */}
      <main className="flex-1 overflow-y-auto pb-32 lg:pb-0">
        <AppHeader
          title={activeTab === 'dashboard' ? 'Métricas' : activeTab === 'orders' ? 'Pedidos' : 'Cardápio'}
          rightElement={
            <button onClick={onSwitchMode} className="p-2.5 text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-all shadow-sm">
              <LogOut size={20} />
            </button>
          }
        />

        <div className="p-4 lg:p-8 max-w-6xl mx-auto space-y-6 lg:space-y-8">
          {activeTab === 'dashboard' && (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6">
                <div className="bg-white p-5 lg:p-7 rounded-[2rem] lg:rounded-[2.5rem] shadow-sm border-2 border-gray-50">
                  <p className="text-gray-400 text-[9px] lg:text-[10px] font-black uppercase tracking-widest mb-1">Ativos</p>
                  <p className="text-2xl lg:text-4xl font-black text-red-600 italic tracking-tighter">{activeOrders.length}</p>
                </div>
                <div className="bg-white p-5 lg:p-7 rounded-[2rem] lg:rounded-[2.5rem] shadow-sm border-2 border-gray-50">
                  <p className="text-gray-400 text-[9px] lg:text-[10px] font-black uppercase tracking-widest mb-1">Total Pedidos</p>
                  <p className="text-2xl lg:text-4xl font-black text-gray-900 italic tracking-tighter">{orders.length}</p>
                </div>
              </div>

              <div className="bg-white p-5 lg:p-8 rounded-[2.5rem] lg:rounded-[3rem] shadow-sm border-2 border-gray-50">
                <div className="flex flex-col lg:flex-row justify-between lg:items-center mb-6 lg:mb-8 gap-4">
                  <h3 className="font-black italic text-lg lg:text-xl uppercase tracking-tighter">Performance de Vendas</h3>
                  <div className="bg-gray-50 w-fit px-3 py-1.5 rounded-xl text-[10px] font-black text-gray-400 uppercase tracking-widest">Últimos 7 dias</div>
                </div>
                <div className="h-48 lg:h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 'bold' }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 'bold' }} />
                      <Tooltip
                        contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', fontWeight: 'bold' }}
                      />
                      <Line type="monotone" dataKey="sales" stroke="#dc2626" strokeWidth={4} dot={{ r: 4, fill: '#dc2626', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </>
          )}

          {activeTab === 'orders' && (
            <div className="space-y-10">
              <section className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl lg:text-2xl font-black text-gray-900 italic tracking-tighter uppercase">Fila de Produção</h2>
                  <div className="bg-red-50 text-red-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">{activeOrders.length} Ativos</div>
                </div>

                {activeOrders.length === 0 ? (
                  <div className="bg-white p-12 lg:p-16 rounded-[2.5rem] lg:rounded-[3rem] text-center border-4 border-dashed border-gray-100">
                    <Package size={48} className="mx-auto mb-4 text-gray-200" />
                    <p className="text-gray-400 font-black uppercase tracking-widest text-xs italic">Sem pedidos pendentes...</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
                    {activeOrders.map(order => (
                      <div key={order.id} className="bg-white p-6 lg:p-8 rounded-[2.5rem] lg:rounded-[3rem] shadow-sm border-2 border-gray-50 hover:border-red-200 transition-all group animate-in fade-in zoom-in-95">
                        <div className="flex justify-between items-start mb-6">
                          <div>
                            <p className="text-[10px] font-black text-red-600 uppercase tracking-widest mb-1 italic">#{order.id}</p>
                            <p className="text-gray-900 font-black text-xl lg:text-2xl tracking-tighter">R${order.total.toFixed(2)}</p>
                          </div>
                          <div className={`px-3 lg:px-4 py-1.5 rounded-full text-[9px] lg:text-[10px] font-black uppercase tracking-widest ${order.status === 'pending' ? 'bg-red-100 text-red-600' :
                            order.status === 'confirmed' ? 'bg-orange-100 text-orange-600' :
                              'bg-blue-100 text-blue-600'
                            }`}>
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
                        </div>

                        <div className="flex gap-2">
                          {order.status === 'pending' && (
                            <button
                              onClick={() => onUpdateOrder(order.id, 'confirmed')}
                              className="flex-1 bg-gray-900 text-white py-4 rounded-[1.5rem] font-black text-[10px] lg:text-xs uppercase tracking-widest hover:bg-red-600 transition-all flex items-center justify-center gap-3 shadow-xl"
                            >
                              <CheckCircle size={18} /> Confirmar
                            </button>
                          )}
                          {order.status === 'confirmed' && (
                            <button
                              onClick={() => onUpdateOrder(order.id, 'ready')}
                              className="flex-1 bg-red-600 text-white py-4 rounded-[1.5rem] font-black text-[10px] lg:text-xs uppercase tracking-widest hover:bg-red-700 transition-all flex items-center justify-center gap-3 shadow-xl"
                            >
                              <ChefHat size={18} /> Pronto
                            </button>
                          )}
                          {order.status === 'ready' && (
                            <div className="flex-1 bg-gray-100 text-gray-400 py-4 rounded-[1.5rem] font-black text-[10px] lg:text-xs uppercase tracking-widest flex items-center justify-center gap-3 italic">
                              <Clock size={18} /> Coleta pendente
                            </div>
                          )}

                          <button
                            onClick={() => setActiveChatOrder(order)}
                            className="p-4 bg-blue-50 text-blue-600 rounded-[1.5rem] hover:bg-blue-600 hover:text-white transition-all shadow-sm group relative"
                          >
                            <MessageCircle size={18} />
                            {messages.filter(m => m.orderId === order.id && m.sender === 'user').length > 0 && (
                              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 border-2 border-white rounded-full animate-pulse"></span>
                            )}
                          </button>

                          <button
                            onClick={() => onDeleteOrder(order.id)}
                            className="p-4 bg-red-50 text-red-600 rounded-[1.5rem] hover:bg-red-600 hover:text-white transition-all shadow-sm group"
                            title="Remover Pedido"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {historyOrders.length > 0 && (
                <section className="space-y-6 opacity-60 grayscale hover:opacity-100 hover:grayscale-0 transition-all">
                  <div className="flex justify-between items-center px-2">
                    <h2 className="text-lg font-black text-gray-400 italic tracking-tighter uppercase flex items-center gap-2">
                      <Archive size={18} /> Histórico Recente
                    </h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {historyOrders.map(order => (
                      <div key={order.id} className="bg-white p-5 rounded-[2rem] border border-gray-100 shadow-sm flex items-center justify-between group">
                        <div>
                          <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest mb-0.5">#{order.id}</p>
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${order.status === 'delivered' ? 'bg-green-500' : 'bg-red-400'}`}></span>
                            <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">{statusMap[order.status]}</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setActiveChatOrder(order)}
                            className="p-2 text-gray-300 hover:text-blue-500 transition-colors"
                          >
                            <MessageCircle size={16} />
                          </button>
                          <button
                            onClick={() => onDeleteOrder(order.id)}
                            className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                          >
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
                    {localProducts.map(product => (
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
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Admin Chat Modal */}
      <Modal
        isOpen={!!activeChatOrder}
        onClose={() => setActiveChatOrder(null)}
        title={activeChatOrder ? `Pedido #${activeChatOrder.id}` : ''}
        subtitle="Chat Direto com Estabelecimento"
      >
        <ChatInterface
          messages={messages.filter(m => m.orderId === activeChatOrder?.id)}
          onSendMessage={(text) => activeChatOrder && onSendMessage(activeChatOrder.id, text, 'store')}
          senderRole="store"
          placeholder="Responda ao cliente..."
        />
      </Modal>

      {/* Nav Mobile */}
      <nav className="fixed bottom-0 left-0 right-0 lg:hidden bg-white border-t border-gray-100 flex justify-around py-4 z-50 shadow-[0_-10px_30px_rgba(0,0,0,0.05)] rounded-t-[2.5rem]">
        <NavButton icon={<LayoutDashboard />} label="Painel" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
        <NavButton icon={<Package />} label="Pedidos" active={activeTab === 'orders'} onClick={() => setActiveTab('orders')} />
        <NavButton icon={<ShoppingBag />} label="Cardápio" active={activeTab === 'inventory'} onClick={() => setActiveTab('inventory')} />
      </nav>

      {/* Modal Novo Prato */}
      <Modal
        isOpen={showNewProductModal}
        onClose={() => setShowNewProductModal(false)}
        title="Novo Prato"
        subtitle="Adicione um novo item ao seu cardápio"
      >
        <form onSubmit={handleAddProduct} className="p-8 space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-3">Nome do Prato</label>
            <input required placeholder="Ex: Burger Gourmet" className="w-full bg-gray-50 border-none rounded-xl p-4 font-bold shadow-inner" value={newProduct.name} onChange={e => setNewProduct({ ...newProduct, name: e.target.value })} />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-3">Preço (R$)</label>
            <input required type="number" step="0.01" placeholder="0,00" className="w-full bg-gray-50 border-none rounded-xl p-4 font-bold shadow-inner" value={newProduct.price} onChange={e => setNewProduct({ ...newProduct, price: e.target.value })} />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-3">Descrição</label>
            <textarea required placeholder="Descreva os ingredientes..." className="w-full bg-gray-50 border-none rounded-xl p-4 font-bold h-32 shadow-inner" value={newProduct.description} onChange={e => setNewProduct({ ...newProduct, description: e.target.value })} />
          </div>
          <button type="submit" className="w-full bg-red-600 text-white py-5 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-red-100 mt-4 active:scale-95 transition-all">Salvar Prato</button>
        </form>
      </Modal>
    </div>
  );
};

export default AdminPanel;
