
import React, { useState } from 'react';
import { supabase } from '../../services/supabase';
import { AppView } from '../../types';
import { Mail, Lock, Store, ArrowRight, ChevronLeft, Loader2, Zap, Building2 } from 'lucide-react';

interface LoginStoreProps {
    onBack: () => void;
    onLoginSuccess: (role: AppView) => void;
}

const LoginStore: React.FC<LoginStoreProps> = ({ onBack, onLoginSuccess }) => {
    const [isSignUp, setIsSignUp] = useState(false);
    const [step, setStep] = useState(0); // 0: Info, 1: Plans
    const [selectedPlan, setSelectedPlan] = useState<'basic' | 'pro'>('basic');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [storeName, setStoreName] = useState('');
    const [cnpj, setCnpj] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (isSignUp) {
                if (step === 0) {
                    setStep(1);
                    setLoading(false);
                    return;
                }

                const { error: signUpError } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            role: 'store',
                            full_name: storeName,
                            cnpj: cnpj,
                            selected_plan: selectedPlan
                        }
                    }
                });
                if (signUpError) throw signUpError;
                alert('Cadastro realizado! Confirme o e-mail do estabelecimento para ativar sua conta.');
                setStep(0);
                setIsSignUp(false);
            } else {
                const { error: signInError, data } = await supabase.auth.signInWithPassword({
                    email,
                    password
                });
                if (signInError) throw signInError;
                if (data.user) {
                    onLoginSuccess(AppView.ADMIN);
                }
            }
        } catch (err: any) {
            setError(err.message || 'Erro na autenticação');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-md mx-auto min-h-screen bg-gray-900 p-8 flex flex-col text-white">
            <button onClick={onBack} className="p-2 -ml-2 w-fit hover:bg-gray-800 rounded-full transition-colors mb-8">
                <ChevronLeft size={24} className="text-gray-400" />
            </button>

            <div className="flex-1">
                <div className="mb-10 text-center">
                    <div className="w-16 h-16 bg-red-600 text-white rounded-3xl flex items-center justify-center mx-auto mb-6 rotate-3 shadow-2xl shadow-red-900/50">
                        <Store size={32} />
                    </div>
                    <h1 className="text-3xl font-black italic uppercase tracking-tighter text-white leading-none">
                        {isSignUp ? 'Credenciar Loja' : 'Painel Loja'}
                    </h1>
                    <p className="text-[10px] text-gray-500 font-black uppercase tracking-[0.2em] mt-2">
                        Gestão PedeAí Established
                    </p>
                </div>

                <form onSubmit={handleAuth} className="space-y-4">
                    {isSignUp && step === 0 && (
                        <>
                            <div className="relative group">
                                <input
                                    required
                                    type="text"
                                    placeholder="Nome da Loja"
                                    className="w-full pl-14 pr-6 py-5 bg-gray-800 border-none rounded-[2rem] text-sm font-bold focus:ring-4 focus:ring-red-500/20 shadow-inner group-hover:bg-gray-700 transition-all text-white placeholder-gray-500"
                                    value={storeName}
                                    onChange={e => setStoreName(e.target.value)}
                                />
                                <Store className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-red-500 transition-colors" size={20} />
                            </div>
                            <div className="relative group">
                                <input
                                    required
                                    type="text"
                                    placeholder="CNPJ do Estabelecimento"
                                    className="w-full pl-14 pr-6 py-5 bg-gray-800 border-none rounded-[2rem] text-sm font-bold focus:ring-4 focus:ring-red-500/20 shadow-inner group-hover:bg-gray-700 transition-all text-white placeholder-gray-500"
                                    value={cnpj}
                                    onChange={e => setCnpj(e.target.value)}
                                />
                                <Building2 className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-red-500 transition-colors" size={20} />
                            </div>
                        </>
                    )}

                    {isSignUp && step === 1 && (
                        <div className="space-y-4 py-2">
                            <h2 className="text-center text-sm font-black uppercase tracking-widest text-gray-400 mb-4">Escolha seu plano</h2>

                            <button
                                type="button"
                                onClick={() => setSelectedPlan('basic')}
                                className={`w-full p-6 rounded-[2rem] border-2 transition-all text-left flex items-start gap-4 ${selectedPlan === 'basic' ? 'border-red-600 bg-red-600/10' : 'border-gray-800 bg-gray-800/50 hover:border-gray-700'
                                    }`}
                            >
                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mt-1 transition-colors ${selectedPlan === 'basic' ? 'border-red-600' : 'border-gray-600'
                                    }`}>
                                    {selectedPlan === 'basic' && <div className="w-3 h-3 bg-red-600 rounded-full" />}
                                </div>
                                <div>
                                    <h3 className="font-black italic text-lg leading-none mb-1">PEDEAÍ BASIC</h3>
                                    <p className="text-2xl font-black text-white mb-2">R$ 100,00<span className="text-xs text-gray-500 ml-1">/mês</span></p>
                                    <div className="space-y-1">
                                        <p className="text-[10px] text-gray-400 uppercase font-bold">• 15% de comissão por venda</p>
                                        <p className="text-[10px] text-gray-400 uppercase font-bold">• Repasse em 7 dias</p>
                                    </div>
                                </div>
                            </button>

                            <button
                                type="button"
                                onClick={() => setSelectedPlan('pro')}
                                className={`w-full p-6 rounded-[2rem] border-2 transition-all text-left flex items-start gap-4 relative overflow-hidden ${selectedPlan === 'pro' ? 'border-red-600 bg-red-600/10' : 'border-gray-800 bg-gray-800/50 hover:border-gray-700'
                                    }`}
                            >
                                <div className="absolute top-4 right-6 bg-red-600 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest animate-pulse">
                                    Recomendado
                                </div>
                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mt-1 transition-colors ${selectedPlan === 'pro' ? 'border-red-600' : 'border-gray-600'
                                    }`}>
                                    {selectedPlan === 'pro' && <div className="w-3 h-3 bg-red-600 rounded-full" />}
                                </div>
                                <div>
                                    <h3 className="font-black italic text-lg leading-none mb-1">PEDEAÍ PRO</h3>
                                    <p className="text-2xl font-black text-white mb-2">R$ 150,00<span className="text-xs text-gray-500 ml-1">/mês</span></p>
                                    <div className="space-y-1">
                                        <p className="text-[10px] text-gray-400 uppercase font-bold">• 10% de comissão por venda</p>
                                        <p className="text-[10px] text-gray-400 uppercase font-bold">• Destaque na plataforma</p>
                                        <p className="text-[10px] text-gray-400 uppercase font-bold">• Repasse em 24 horas</p>
                                    </div>
                                </div>
                            </button>
                        </div>
                    )}

                    {(!isSignUp || (isSignUp && step === 0)) && (
                        <>
                            <div className="relative group">
                                <input
                                    required
                                    type="email"
                                    placeholder="E-mail Corporativo"
                                    className="w-full pl-14 pr-6 py-5 bg-gray-800 border-none rounded-[2rem] text-sm font-bold focus:ring-4 focus:ring-red-500/20 shadow-inner group-hover:bg-gray-700 transition-all text-white placeholder-gray-500"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                />
                                <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-red-500 transition-colors" size={20} />
                            </div>

                            <div className="relative group">
                                <input
                                    required
                                    type="password"
                                    placeholder="Senha de Acesso"
                                    className="w-full pl-14 pr-6 py-5 bg-gray-800 border-none rounded-[2rem] text-sm font-bold focus:ring-4 focus:ring-red-500/20 shadow-inner group-hover:bg-gray-700 transition-all text-white placeholder-gray-500"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                />
                                <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-red-500 transition-colors" size={20} />
                            </div>
                        </>
                    )}

                    {error && (
                        <div className="bg-red-500/10 text-red-500 p-4 rounded-3xl text-xs font-black uppercase tracking-widest text-center border border-red-500/20 animate-in fade-in slide-in-from-top-2">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-red-600 text-white py-6 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-red-900/40 active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:bg-gray-800 disabled:text-gray-600"
                    >
                        {loading ? <Loader2 className="animate-spin" size={20} /> : (
                            <>{isSignUp ? (step === 0 ? 'Continuar para Planos' : 'Finalizar Cadastro') : 'Acessar Painel'} <ArrowRight size={20} /></>
                        )}
                    </button>
                </form>

                <button
                    onClick={() => {
                        setIsSignUp(!isSignUp);
                        setStep(0);
                    }}
                    className="w-full mt-8 text-xs font-black text-gray-600 uppercase tracking-widest hover:text-red-500 transition-colors"
                >
                    {isSignUp ? 'Voltar ao Login' : 'Quer vender no PedeAí? Credencie-se'}
                </button>
            </div>

            <div className="mt-auto text-center py-8 opacity-30">
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.3em]">Ambiente Seguro Established</p>
            </div>
        </div>
    );
};

export default LoginStore;
