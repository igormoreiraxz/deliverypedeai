
import React, { useState } from 'react';
import { supabase } from '../../services/supabase';
import { AppView } from '../../types';
import { Mail, Lock, User, ArrowRight, ChevronLeft, Loader2, Zap, Navigation, IdCard } from 'lucide-react';

interface LoginCourierProps {
    onBack: () => void;
    onLoginSuccess: (role: AppView) => void;
}

const LoginCourier: React.FC<LoginCourierProps> = ({ onBack, onLoginSuccess }) => {
    const [isSignUp, setIsSignUp] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [cnh, setCnh] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (isSignUp) {
                const { error: signUpError } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            role: 'courier',
                            full_name: fullName,
                            cnh: cnh
                        }
                    }
                });
                if (signUpError) throw signUpError;
                alert('Cadastro enviado! Confirme seu e-mail.');
            } else {
                const { error: signInError, data } = await supabase.auth.signInWithPassword({
                    email,
                    password
                });
                if (signInError) throw signInError;
                if (data.user) {
                    onLoginSuccess(AppView.COURIER);
                }
            }
        } catch (err: any) {
            setError(err.message || 'Erro na autenticação');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-md mx-auto min-h-screen bg-gray-50 p-8 flex flex-col">
            <button onClick={onBack} className="p-2 -ml-2 w-fit hover:bg-white rounded-full transition-colors mb-8 shadow-sm">
                <ChevronLeft size={24} className="text-gray-600" />
            </button>

            <div className="flex-1">
                <div className="mb-10 text-center">
                    <div className="w-16 h-16 bg-red-600 text-white rounded-[2rem] flex items-center justify-center mx-auto mb-6 rotate-[-10deg] shadow-xl shadow-red-200">
                        <Navigation size={32} className="fill-current" />
                    </div>
                    <h1 className="text-3xl font-black italic uppercase tracking-tighter text-gray-900 leading-none">
                        {isSignUp ? 'Be a Pro' : 'Entregador'}
                    </h1>
                    <p className="text-[10px] text-red-600 font-black uppercase tracking-[0.2em] mt-2">
                        PedeAí Logistics
                    </p>
                </div>

                <form onSubmit={handleAuth} className="space-y-4">
                    {isSignUp && (
                        <>
                            <div className="relative group">
                                <input
                                    required
                                    type="text"
                                    placeholder="Seu Nome Completo"
                                    className="w-full pl-14 pr-6 py-5 bg-white border-2 border-transparent rounded-[2rem] text-sm font-bold focus:border-red-600/20 focus:ring-4 focus:ring-red-600/5 shadow-sm group-hover:bg-white transition-all"
                                    value={fullName}
                                    onChange={e => setFullName(e.target.value)}
                                />
                                <User className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-red-600 transition-colors" size={20} />
                            </div>
                            <div className="relative group">
                                <input
                                    required
                                    type="text"
                                    placeholder="CNH (Número do registro)"
                                    className="w-full pl-14 pr-6 py-5 bg-white border-2 border-transparent rounded-[2rem] text-sm font-bold focus:border-red-600/20 focus:ring-4 focus:ring-red-600/5 shadow-sm group-hover:bg-white transition-all"
                                    value={cnh}
                                    onChange={e => setCnh(e.target.value)}
                                />
                                <IdCard className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-red-600 transition-colors" size={20} />
                            </div>
                        </>
                    )}

                    <div className="relative group">
                        <input
                            required
                            type="email"
                            placeholder="E-mail"
                            className="w-full pl-14 pr-6 py-5 bg-white border-2 border-transparent rounded-[2rem] text-sm font-bold focus:border-red-600/20 focus:ring-4 focus:ring-red-600/5 shadow-sm group-hover:bg-white transition-all"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                        />
                        <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-red-600 transition-colors" size={20} />
                    </div>

                    <div className="relative group">
                        <input
                            required
                            type="password"
                            placeholder="Senha"
                            className="w-full pl-14 pr-6 py-5 bg-white border-2 border-transparent rounded-[2rem] text-sm font-bold focus:border-red-600/20 focus:ring-4 focus:ring-red-600/5 shadow-sm group-hover:bg-white transition-all"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                        />
                        <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-red-600 transition-colors" size={20} />
                    </div>

                    {error && (
                        <div className="bg-red-50 text-red-600 p-4 rounded-3xl text-xs font-black uppercase tracking-widest text-center border border-red-100 animate-in fade-in slide-in-from-top-2">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gray-900 text-white py-6 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-gray-200 active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:bg-gray-200"
                    >
                        {loading ? <Loader2 className="animate-spin" size={20} /> : (
                            <>{isSignUp ? 'Quero Entregar' : 'Entrar na Rota'} <ArrowRight size={20} /></>
                        )}
                    </button>
                </form>

                <button
                    onClick={() => setIsSignUp(!isSignUp)}
                    className="w-full mt-8 text-xs font-black text-gray-400 uppercase tracking-widest hover:text-red-600 transition-colors"
                >
                    {isSignUp ? 'Já sou entregador' : 'Faça parte do time de elite'}
                </button>
            </div>

            <div className="mt-auto text-center py-8">
                <div className="flex items-center justify-center gap-2 text-[10px] text-gray-300 font-bold uppercase tracking-[0.2em]">
                    <Zap size={12} className="text-red-600 fill-red-600" /> Powered by PedeAí Tech
                </div>
            </div>
        </div>
    );
};

export default LoginCourier;
