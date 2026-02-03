
import React, { useState } from 'react';
import { supabase } from '../../services/supabase';
import { AppView } from '../../types';
import { Mail, Lock, User, ArrowRight, ChevronLeft, Loader2, Zap } from 'lucide-react';

interface LoginClientProps {
    onBack: () => void;
    onLoginSuccess: (role: AppView) => void;
}

const LoginClient: React.FC<LoginClientProps> = ({ onBack, onLoginSuccess }) => {
    const [isSignUp, setIsSignUp] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
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
                            role: 'client',
                            full_name: fullName
                        }
                    }
                });
                if (signUpError) throw signUpError;
                alert('Confirme seu e-mail para ativar sua conta!');
            } else {
                const { error: signInError, data } = await supabase.auth.signInWithPassword({
                    email,
                    password
                });
                if (signInError) throw signInError;

                if (data.user) {
                    // Fetch user profile to check role
                    const { data: profile, error: profileError } = await supabase
                        .from('profiles')
                        .select('role')
                        .eq('id', data.user.id)
                        .single();

                    if (profileError) {
                        console.error('Error fetching profile:', profileError);
                        // Default to customer if error, or handle appropriately
                        onLoginSuccess(AppView.CUSTOMER);
                    } else if (profile?.role === 'staff') {
                        onLoginSuccess(AppView.STAFF);
                    } else if (profile?.role === 'store') {
                        // Assuming there is a STORE view or similar, for now logging
                        console.log('Store login');
                        // You might want to handle store login here too if not already
                        onLoginSuccess(AppView.CUSTOMER); // consistent with previous default? Or maybe should be separate.
                        // Previous code just did onLoginSuccess(AppView.CUSTOMER).
                        // I will keep it for non-staff for now to not break existing flow, unless told otherwise.
                    } else {
                        onLoginSuccess(AppView.CUSTOMER);
                    }
                }
            }
        } catch (err: any) {
            setError(err.message || 'Erro na autenticação');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-md mx-auto min-h-screen bg-white p-8 flex flex-col">
            <button onClick={onBack} className="p-2 -ml-2 w-fit hover:bg-gray-100 rounded-full transition-colors mb-8">
                <ChevronLeft size={24} />
            </button>

            <div className="flex-1">
                <div className="mb-10 text-center">
                    <div className="w-16 h-16 bg-red-50 text-red-600 rounded-3xl flex items-center justify-center mx-auto mb-6 rotate-3 shadow-xl shadow-red-50">
                        <Zap size={32} className="fill-red-600" />
                    </div>
                    <h1 className="text-3xl font-black italic uppercase tracking-tighter text-gray-900 leading-none">
                        {isSignUp ? 'Criar Conta' : 'PedeAí'}
                    </h1>
                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em] mt-2">
                        Área do Cliente
                    </p>
                </div>

                <form onSubmit={handleAuth} className="space-y-4">
                    {isSignUp && (
                        <div className="relative group">
                            <input
                                required
                                type="text"
                                placeholder="Seu Nome Completo"
                                className="w-full pl-14 pr-6 py-5 bg-gray-50 border-none rounded-[2rem] text-sm font-bold focus:ring-4 focus:ring-red-500/10 shadow-inner group-hover:bg-gray-100 transition-all"
                                value={fullName}
                                onChange={e => setFullName(e.target.value)}
                            />
                            <User className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-red-500 transition-colors" size={20} />
                        </div>
                    )}

                    <div className="relative group">
                        <input
                            required
                            type="email"
                            placeholder="E-mail"
                            className="w-full pl-14 pr-6 py-5 bg-gray-50 border-none rounded-[2rem] text-sm font-bold focus:ring-4 focus:ring-red-500/10 shadow-inner group-hover:bg-gray-100 transition-all"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                        />
                        <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-red-500 transition-colors" size={20} />
                    </div>

                    <div className="relative group">
                        <input
                            required
                            type="password"
                            placeholder="Senha"
                            className="w-full pl-14 pr-6 py-5 bg-gray-50 border-none rounded-[2rem] text-sm font-bold focus:ring-4 focus:ring-red-500/10 shadow-inner group-hover:bg-gray-100 transition-all"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                        />
                        <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-red-500 transition-colors" size={20} />
                    </div>

                    {error && (
                        <div className="bg-red-50 text-red-600 p-4 rounded-3xl text-xs font-black uppercase tracking-widest text-center border border-red-100 animate-in fade-in slide-in-from-top-2">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-red-600 text-white py-6 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-red-200 active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:bg-gray-200"
                    >
                        {loading ? <Loader2 className="animate-spin" size={20} /> : (
                            <>{isSignUp ? 'Cadastrar Agora' : 'Entrar no PedeAí'} <ArrowRight size={20} /></>
                        )}
                    </button>
                </form>

                <button
                    onClick={() => setIsSignUp(!isSignUp)}
                    className="w-full mt-8 text-xs font-black text-gray-400 uppercase tracking-widest hover:text-red-600 transition-colors"
                >
                    {isSignUp ? 'Já tem conta? Entrar' : 'Não tem conta? Criar agora'}
                </button>
            </div>

            <div className="mt-auto text-center py-8">
                <p className="text-[10px] text-gray-300 font-bold uppercase tracking-[0.3em]">Ambiente 100% Seguro</p>
            </div>
        </div>
    );
};

export default LoginClient;
