
import React, { useState } from 'react';
import { supabase } from '../../services/supabase';
import { AppView } from '../../types';
import { Mail, Lock, Store, ArrowRight, ChevronLeft, Loader2, Zap } from 'lucide-react';

interface LoginStoreProps {
    onBack: () => void;
    onLoginSuccess: (role: AppView) => void;
}

const LoginStore: React.FC<LoginStoreProps> = ({ onBack, onLoginSuccess }) => {
    const [isSignUp, setIsSignUp] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [storeName, setStoreName] = useState('');
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
                            role: 'store',
                            full_name: storeName
                        }
                    }
                });
                if (signUpError) throw signUpError;
                alert('Confirme o e-mail do estabelecimento!');
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
                    {isSignUp && (
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
                    )}

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
                            <>{isSignUp ? 'Finalizar Cadastro' : 'Acessar Painel'} <ArrowRight size={20} /></>
                        )}
                    </button>
                </form>

                <button
                    onClick={() => setIsSignUp(!isSignUp)}
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
