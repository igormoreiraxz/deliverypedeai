import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { Coupon, Store, SupportTicket } from '../../types';
import { MessageSquare, Ticket, Building2, LogOut, CheckCircle, XCircle, Plus, Trash2, Send } from 'lucide-react';

interface StaffDashboardProps {
    onLogout: () => void;
}

const StaffDashboard: React.FC<StaffDashboardProps> = ({ onLogout }) => {
    const [activeTab, setActiveTab] = useState<'support' | 'coupons' | 'establishments'>('interactions'); // Typo in initial state fixed in logic below
    // Actually let's use string state for tabs
    const [currentTab, setCurrentTab] = useState('establishments');

    // Data states
    const [pendingStores, setPendingStores] = useState<any[]>([]);
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [loading, setLoading] = useState(false);

    // Coupon form state
    const [newCoupon, setNewCoupon] = useState({
        code: '',
        discount_value: 0,
        discount_type: 'percentage',
        min_order_value: 0,
    });

    // Support state
    const [tickets, setTickets] = useState<SupportTicket[]>([]);
    const [replyText, setReplyText] = useState('');

    useEffect(() => {
        fetchData();
    }, [currentTab]);

    const fetchData = async () => {
        setLoading(true);
        if (currentTab === 'establishments') {
            const { data } = await supabase
                .from('profiles')
                .select('*')
                .eq('role', 'store')
                // .eq('status', 'pending') // Optionally filter by pending logic later, for now show all stores or sort by status
                .order('created_at', { ascending: false });
            setPendingStores(data || []);
        } else if (currentTab === 'coupons') {
            const { data } = await supabase
                .from('coupons')
                .select('*')
                .order('created_at', { ascending: false });
            setCoupons(data || []);
        } else if (currentTab === 'support') {
            const { data } = await supabase
                .from('support_messages')
                .select('*')
                .order('created_at', { ascending: false });
            setTickets(data || []);
        }
        setLoading(false);
    };

    const handleUpdateStoreStatus = async (storeId: string, status: string) => {
        const { error } = await supabase
            .from('profiles')
            .update({ status })
            .eq('id', storeId);

        if (!error) {
            fetchData();
            alert(`Loja ${status === 'approved' ? 'aprovada' : 'rejeitada/suspensa'} com sucesso!`);
        } else {
            alert('Erro ao atualizar status');
        }
    };

    const handleCreateCoupon = async (e: React.FormEvent) => {
        e.preventDefault();
        const { error } = await supabase
            .from('coupons')
            .insert([{
                ...newCoupon,
                active: true
            }]);

        if (!error) {
            setNewCoupon({ code: '', discount_value: 0, discount_type: 'percentage', min_order_value: 0 });
            fetchData();
            alert('Cupom criado!');
        } else {
            alert('Erro ao criar cupom. Verifique se o código já existe.');
        }
    };

    const toggleCouponStatus = async (id: string, currentStatus: boolean) => {
        await supabase.from('coupons').update({ active: !currentStatus }).eq('id', id);
        fetchData();
    };

    const handleSendReply = async (userId: string) => {
        if (!replyText.trim()) return;

        const { error } = await supabase
            .from('support_messages')
            .insert({
                user_id: userId,
                text: replyText,
                sender_type: 'staff'
            });

        if (!error) {
            setReplyText('');
            fetchData();
            alert('Resposta enviada!');
        } else {
            console.error(error);
            alert('Erro ao enviar resposta');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Header */}
            <div className="bg-white px-6 py-4 shadow-sm flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center text-red-600">
                        <Building2 size={24} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">Painel Staff</h1>
                        <p className="text-xs text-gray-500 font-medium">Administração do Sistema</p>
                    </div>
                </div>
                <button onClick={onLogout} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all">
                    <LogOut size={20} />
                </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 p-4 overflow-x-auto bg-white border-b border-gray-100">
                {[
                    { id: 'establishments', label: 'Estabelecimentos', icon: Building2 },
                    { id: 'coupons', label: 'Cupons', icon: Ticket },
                    { id: 'support', label: 'Suporte', icon: MessageSquare },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setCurrentTab(tab.id)}
                        className={`
                            flex items-center gap-2 px-4 py-3 rounded-xl font-bold text-sm transition-all whitespace-nowrap
                            ${currentTab === tab.id
                                ? 'bg-red-600 text-white shadow-lg shadow-red-200'
                                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}
                        `}
                    >
                        <tab.icon size={18} />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="flex-1 p-4 max-w-5xl mx-auto w-full">
                {currentTab === 'establishments' && (
                    <div className="space-y-4">
                        <h2 className="text-lg font-bold mb-4">Gerenciar Lojas</h2>
                        {loading ? <p>Carregando...</p> : pendingStores.map(store => (
                            <div key={store.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden">
                                        {store.image_url ? <img src={store.image_url} alt={store.name} className="w-full h-full object-cover" /> : <Building2 className="text-gray-400" />}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900">{store.full_name || store.name}</h3>
                                        <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                                            <span className={`px-2 py-0.5 rounded-full ${store.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                                {store.status || 'pending'}
                                            </span>
                                            <span>{new Date(store.created_at).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-2 w-full sm:w-auto">
                                    {store.status !== 'approved' && (
                                        <button
                                            onClick={() => handleUpdateStoreStatus(store.id, 'approved')}
                                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-2 rounded-xl font-bold text-sm hover:bg-green-700"
                                        >
                                            <CheckCircle size={16} /> Aprovar
                                        </button>
                                    )}
                                    {store.status !== 'rejected' && (
                                        <button
                                            onClick={() => handleUpdateStoreStatus(store.id, 'rejected')}
                                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-red-100 text-red-600 px-4 py-2 rounded-xl font-bold text-sm hover:bg-red-200"
                                        >
                                            <XCircle size={16} /> Rejeitar
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {currentTab === 'coupons' && (
                    <div className="grid md:grid-cols-2 gap-8">
                        <div>
                            <h2 className="text-lg font-bold mb-4">Criar Novo Cupom</h2>
                            <form onSubmit={handleCreateCoupon} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Código do Cupom</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 font-bold text-gray-900 focus:ring-2 focus:ring-red-500/20"
                                        placeholder="Ex: PROMO10"
                                        value={newCoupon.code}
                                        onChange={e => setNewCoupon({ ...newCoupon, code: e.target.value.toUpperCase() })}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Valor</label>
                                        <input
                                            type="number"
                                            required
                                            className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 font-bold text-gray-900"
                                            value={newCoupon.discount_value}
                                            onChange={e => setNewCoupon({ ...newCoupon, discount_value: Number(e.target.value) })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Tipo</label>
                                        <select
                                            className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 font-bold text-gray-900"
                                            value={newCoupon.discount_type}
                                            onChange={e => setNewCoupon({ ...newCoupon, discount_type: e.target.value as any })}
                                        >
                                            <option value="percentage">Porcentagem (%)</option>
                                            <option value="fixed">Fixo (R$)</option>
                                        </select>
                                    </div>
                                </div>
                                <button type="submit" className="w-full bg-red-600 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-red-700 transition-colors">
                                    <Plus size={20} /> Criar Cupom
                                </button>
                            </form>
                        </div>

                        <div>
                            <h2 className="text-lg font-bold mb-4">Cupons Ativos</h2>
                            <div className="space-y-3">
                                {coupons.map(coupon => (
                                    <div key={coupon.id} className={`bg-white p-4 rounded-2xl border flex items-center justify-between ${coupon.active ? 'border-green-200 bg-green-50/30' : 'border-gray-100 opacity-60'}`}>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <Ticket size={16} className={coupon.active ? 'text-green-600' : 'text-gray-400'} />
                                                <span className="font-black text-gray-900">{coupon.code}</span>
                                            </div>
                                            <p className="text-sm text-gray-500 mt-1">
                                                {coupon.discount_type === 'percentage' ? `${coupon.discount_value}% OFF` : `R$ ${coupon.discount_value} OFF`}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => toggleCouponStatus(coupon.id, coupon.active)}
                                            className={`p-2 rounded-lg transition-colors ${coupon.active ? 'text-green-600 hover:bg-green-100' : 'text-gray-400 hover:bg-gray-100'}`}
                                        >
                                            {coupon.active ? <CheckCircle size={20} /> : <XCircle size={20} />}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {currentTab === 'support' && (
                    <div className="space-y-4">
                        <h2 className="text-lg font-bold mb-4">Mensagens de Suporte</h2>
                        <div className="grid md:grid-cols-1 gap-4">
                            {tickets.length === 0 ? (
                                <p className="text-gray-400">Nenhuma mensagem encontrada.</p>
                            ) : (
                                tickets.map(ticket => (
                                    <div key={ticket.id} className={`bg-white p-4 rounded-2xl shadow-sm border border-gray-100 ${ticket.sender_type === 'staff' ? 'ml-8 bg-blue-50 border-blue-100' : 'mr-8'}`}>
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                                                {ticket.sender_type === 'staff' ? 'Staff' : 'Usuário ' + ticket.user_id.slice(0, 8)}
                                            </span>
                                            <span className="text-xs text-gray-300">
                                                {new Date(ticket.created_at).toLocaleString()}
                                            </span>
                                        </div>
                                        <p className="text-gray-800">{ticket.text}</p>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StaffDashboard;
