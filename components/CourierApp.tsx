
import React, { useState, useEffect } from 'react';
import { getCurrentProfile, Profile } from '../services/profiles';
import {
  MapPin,
  Navigation,
  DollarSign,
  Package,
  Bell,
  User,
  CheckCircle,
  Clock,
  ChevronRight,
  Calendar,
  CheckCircle2,
  XCircle,
  Power,
  ShieldAlert,
  Wifi,
  WifiOff
} from 'lucide-react';
import { Order } from '../types';
import NavButton from './shared/NavButton';
import AppHeader from './shared/AppHeader';
import Modal from './shared/Modal';
import ChatInterface from './shared/ChatInterface';

interface CourierAppProps {
  onSwitchMode: () => void;
  orders: Order[];
  onUpdateOrder: (id: string, status: Order['status'], courierId?: string) => void;
  currentUser?: Profile | null;
}

type CourierTab = 'delivery' | 'wallet' | 'history';

const CourierApp: React.FC<CourierAppProps> = ({ onSwitchMode, orders, onUpdateOrder }) => {
  const [activeTab, setActiveTab] = useState<CourierTab>('delivery');
  const [isOnline, setIsOnline] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      const p = await getCurrentProfile();
      setProfile(p);
    };
    fetchProfile();
  }, []);

  const courierId = profile?.id || 'courier-loading';

  // Couriers only see orders that are READY for pickup
  const availableOrders = orders.filter(o => o.status === 'ready');
  const myCurrentOrder = orders.find(o => o.status === 'shipping' && o.courierId === courierId);
  const myHistory = orders.filter(o => o.status === 'delivered' && o.courierId === courierId);

  const calculateCommission = (total: number) => total * 0.15;
  const totalGains = myHistory.reduce((acc, curr) => acc + calculateCommission(curr.total), 0);

  // Simular notificação quando novos pedidos aparecem e está online
  useEffect(() => {
    if (isOnline && availableOrders.length > 0 && !myCurrentOrder) {
      setShowNotification(true);
      const timer = setTimeout(() => setShowNotification(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [availableOrders.length, isOnline, myCurrentOrder]);

  return (
    <div className="max-w-md mx-auto bg-gray-50 min-h-screen shadow-lg pb-24 relative overflow-hidden">
      {/* Toast Notification */}
      {showNotification && isOnline && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 w-[90%] max-w-sm z-[100] animate-in slide-in-from-top-10 duration-500">
          <div className="bg-gray-900 text-white p-4 rounded-3xl shadow-2xl border border-white/10 flex items-center gap-4">
            <div className="w-12 h-12 bg-red-600 rounded-2xl flex items-center justify-center shrink-0 animate-pulse">
              <Bell size={24} className="text-white" />
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-red-500">Nova Entrega Próxima</p>
              <p className="text-xs font-bold">Há {availableOrders.length} pedido(s) aguardando coleta!</p>
            </div>
            <button onClick={() => setShowNotification(false)} className="p-2 text-gray-500">
              <XCircle size={20} />
            </button>
          </div>
        </div>
      )}

      <AppHeader
        variant="dark"
        title={profile?.full_name || 'Carregando...'}
        subtitle={isOnline ? 'Modo Ativo' : 'Modo Inativo'}
        showLogo={false}
        rightElement={
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsOnline(!isOnline)}
              className={`relative w-14 h-7 rounded-full transition-all duration-500 p-1 ${isOnline ? 'bg-green-500' : 'bg-gray-700'}`}
            >
              <div className={`w-5 h-5 bg-white rounded-full shadow-lg transform transition-transform duration-500 flex items-center justify-center ${isOnline ? 'translate-x-7' : 'translate-x-0'}`}>
                <Power size={10} className={isOnline ? 'text-green-500' : 'text-gray-400'} />
              </div>
            </button>
            <button onClick={onSwitchMode} className="p-2 bg-gray-800 rounded-xl hover:bg-gray-700 transition-colors">
              <User size={18} className="text-gray-300" />
            </button>
          </div>
        }
      />

      <div className="bg-gray-900 px-6 pb-12 pt-4 relative overflow-hidden">
        <div className={`absolute inset-0 transition-opacity duration-1000 ${isOnline ? 'bg-gradient-to-br from-red-600/20 to-gray-900' : 'bg-gray-900'}`} />
        <div className="relative z-10 bg-white/5 backdrop-blur-xl p-6 rounded-[2.5rem] border border-white/10 shadow-2xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] text-gray-400 uppercase font-black tracking-[0.2em] mb-1">Ganhos de Hoje</p>
              <p className="text-3xl font-black tracking-tighter italic text-white">R$ {totalGains.toFixed(2)}</p>
            </div>
            <div className="w-12 h-12 bg-red-600/20 text-red-500 rounded-2xl flex items-center justify-center">
              <DollarSign size={24} />
            </div>
          </div>
        </div>
      </div>

      <main className="p-4 -mt-8 space-y-6 relative z-10">
        {activeTab === 'delivery' && (
          <div className="animate-in fade-in slide-in-from-bottom-6 duration-500 space-y-6">
            {myCurrentOrder && (
              <section className="bg-red-600 text-white p-7 rounded-[3rem] shadow-2xl relative overflow-hidden group">
                <div className="relative z-10">
                  <div className="flex justify-between items-center mb-6">
                    <span className="bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border border-white/10">Entrega em Curso</span>
                    <span className="font-black italic text-lg tracking-tighter">{myCurrentOrder.id}</span>
                  </div>
                  <div className="mb-6">
                    <p className="text-[10px] text-white/60 font-black uppercase tracking-widest mb-1">Destino Final</p>
                    <p className="text-xl font-black italic tracking-tight leading-tight">{myCurrentOrder.address}</p>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => onUpdateOrder(myCurrentOrder.id, 'delivered')}
                      className="flex-1 bg-white text-red-600 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl active:scale-95 transition-all hover:bg-gray-50 flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 size={18} /> Finalizar Entrega
                    </button>
                    <button className="p-4 bg-red-700/50 backdrop-blur-sm rounded-2xl text-white hover:bg-red-700 transition-all">
                      <Navigation size={22} className="fill-current" />
                    </button>
                  </div>
                </div>
                <div className="absolute top-[-20%] right-[-10%] p-10 opacity-10 rotate-12 group-hover:rotate-0 transition-transform duration-1000">
                  <Package size={180} />
                </div>
              </section>
            )}

            <section className={`bg-white p-6 rounded-[3rem] shadow-[0_10px_40px_rgba(0,0,0,0.02)] border transition-all duration-500 ${isOnline ? 'border-gray-100' : 'border-gray-200 opacity-80'}`}>
              <div className="flex justify-between items-center mb-8">
                <h2 className="font-black text-gray-900 flex items-center tracking-tighter italic text-xl uppercase">
                  <div className={`w-2.5 h-2.5 rounded-full mr-3 shadow-lg transition-all duration-500 ${isOnline ? 'bg-red-600 animate-pulse shadow-red-500/50' : 'bg-gray-300 shadow-none'}`}></div>
                  Oportunidades
                </h2>
                <div className={`px-3 py-1.5 rounded-xl flex items-center gap-2 transition-colors ${isOnline ? 'bg-green-50' : 'bg-gray-100'}`}>
                  <div className={`w-2 h-2 rounded-full transition-colors ${isOnline ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    {isOnline ? 'Sinal Ativo' : 'Desconectado'}
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                {!isOnline ? (
                  <div className="text-center py-20 px-8 bg-gray-50 rounded-[2.5rem] border-4 border-dashed border-gray-100 group">
                    <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl text-gray-300 transition-transform group-hover:scale-110">
                      <WifiOff size={32} />
                    </div>
                    <h3 className="font-black text-gray-900 italic uppercase tracking-tighter text-lg mb-2">Modo Offline</h3>
                    <p className="text-gray-400 font-bold text-[10px] uppercase tracking-widest leading-relaxed">
                      Ative seu status acima para começar a receber notificações de entrega na sua região.
                    </p>
                    <button
                      onClick={() => setIsOnline(true)}
                      className="mt-8 bg-gray-900 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:bg-black transition-all"
                    >
                      Ficar Online
                    </button>
                  </div>
                ) : availableOrders.length === 0 ? (
                  <div className="text-center py-16 px-6 bg-red-50/30 rounded-[2rem] border-2 border-dashed border-red-100">
                    <div className="relative w-12 h-12 mx-auto mb-4">
                      <Wifi size={40} className="text-red-200 animate-ping absolute inset-0" />
                      <Wifi size={40} className="text-red-500 relative" />
                    </div>
                    <p className="text-red-400 font-black text-[10px] uppercase tracking-[0.2em] italic">aguardando entregas </p>
                  </div>
                ) : (
                  availableOrders.map((order) => (
                    <div key={order.id} className="border border-gray-50 bg-white p-6 rounded-[2.5rem] hover:border-red-500/30 transition-all group shadow-sm animate-in fade-in slide-in-from-right-4">
                      <div className="flex justify-between items-start mb-6">
                        <div className="space-y-1">
                          <h3 className="font-black text-gray-900 italic tracking-tighter text-lg uppercase">Pedido #{order.id}</h3>
                          <div className="flex items-center text-[10px] text-gray-400 font-bold gap-2">
                            <MapPin size={12} />
                            {order.address.split(',')[0]}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-green-600 font-black text-2xl tracking-tighter italic">+R$ {calculateCommission(order.total).toFixed(2)}</p>
                          <p className="text-[10px] text-gray-300 font-black tracking-widest uppercase">Ganhos</p>
                        </div>
                      </div>
                      <button
                        onClick={() => onUpdateOrder(order.id, 'shipping', courierId)}
                        disabled={!!myCurrentOrder}
                        className="w-full bg-gray-900 text-white py-4.5 rounded-[1.5rem] font-black text-xs uppercase tracking-widest active:scale-95 disabled:opacity-30 disabled:grayscale transition-all flex items-center justify-center gap-3 hover:bg-black shadow-xl shadow-gray-100"
                      >
                        {!!myCurrentOrder ? 'Conclua a entrega atual' : <><CheckCircle size={18} /> Aceitar e Coletar</>}
                      </button>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="animate-in fade-in slide-in-from-bottom-6 duration-500 space-y-6 pt-12">
            <header className="flex justify-between items-center px-2">
              <div>
                <h2 className="text-3xl font-black text-gray-900 italic tracking-tighter uppercase">Minha <span className="text-red-600">Jornada</span></h2>
                <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em]">Registro histórico de conquistas</p>
              </div>
              <div className="p-4 bg-white rounded-3xl border border-gray-100 shadow-sm">
                <Calendar size={20} className="text-red-600" />
              </div>
            </header>

            <div className="space-y-4">
              {myHistory.length === 0 ? (
                <div className="bg-white p-20 rounded-[3rem] text-center border-2 border-dashed border-gray-100">
                  <Clock size={48} className="mx-auto mb-6 text-gray-100" />
                  <p className="text-gray-300 font-black text-[10px] uppercase tracking-[0.2em]">Nenhuma entrega finalizada ainda</p>
                </div>
              ) : (
                myHistory.map(order => (
                  <div key={order.id} className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-md transition-all flex items-center gap-6 group">
                    <div className="w-16 h-16 bg-green-50 text-green-500 rounded-[1.5rem] flex items-center justify-center flex-shrink-0 group-hover:bg-green-100 transition-colors">
                      <CheckCircle2 size={28} />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-1">
                        <h4 className="font-black text-gray-900 italic text-lg tracking-tighter uppercase">#{order.id}</h4>
                        <span className="text-green-600 font-black italic">R$ {calculateCommission(order.total).toFixed(2)}</span>
                      </div>
                      <div className="flex items-center gap-4 text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                        <span className="flex items-center gap-1"><Clock size={12} /> {new Date(order.createdAt).toLocaleDateString()}</span>
                        <span className="flex items-center gap-1"><Package size={12} /> Entregue</span>
                      </div>
                    </div>
                    <ChevronRight size={20} className="text-gray-200 group-hover:translate-x-1 transition-transform" />
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'wallet' && (
          <div className="animate-in fade-in slide-in-from-bottom-6 duration-500 space-y-6 pt-12">
            <header className="px-2">
              <h2 className="text-3xl font-black text-gray-900 italic tracking-tighter uppercase">Minha <span className="text-red-600">Carteira</span></h2>
              <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em]">Gestão de ganhos e transferências</p>
            </header>

            <div className="bg-gray-900 p-8 rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
              <div className="relative z-10">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40 mb-2">Saldo Disponível</p>
                <h3 className="text-5xl font-black italic tracking-tighter mb-8">R$ {totalGains.toFixed(2)}</h3>
                <button className="w-full bg-white text-gray-900 py-5 rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-xl active:scale-95 transition-all">
                  Solicitar Saque (PIX)
                </button>
              </div>
              <div className="absolute bottom-[-20%] right-[-10%] opacity-5 rotate-[-12deg]">
                <DollarSign size={200} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-6 rounded-[2.5rem] border border-gray-50">
                <p className="text-gray-400 text-[9px] font-black uppercase tracking-widest mb-1">Total Mês</p>
                <p className="text-xl font-black italic text-gray-900 tracking-tighter">R$ 1.250,00</p>
              </div>
              <div className="bg-white p-6 rounded-[2.5rem] border border-gray-50">
                <p className="text-gray-400 text-[9px] font-black uppercase tracking-widest mb-1">Bônus</p>
                <p className="text-xl font-black italic text-red-600 tracking-tighter">R$ 120,00</p>
              </div>
            </div>
          </div>
        )}
      </main>

      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white border-t border-gray-100 flex justify-around py-5 z-30 shadow-[0_-10px_40px_rgba(0,0,0,0.08)] rounded-t-[3rem]">
        <NavButton
          icon={<Package />}
          label="Entregar"
          active={activeTab === 'delivery'}
          onClick={() => setActiveTab('delivery')}
        />
        <NavButton
          icon={<DollarSign />}
          label="Carteira"
          active={activeTab === 'wallet'}
          onClick={() => setActiveTab('wallet')}
        />
        <NavButton
          icon={<Clock />}
          label="Histórico"
          active={activeTab === 'history'}
          onClick={() => setActiveTab('history')}
        />
      </nav>
    </div>
  );
};

export default CourierApp;
