
import React from 'react';
import { ShoppingBag, Truck, BarChart3, ChevronRight, Zap } from 'lucide-react';
import { AppView } from '../types';

interface OnboardingProps {
  onSelect: (view: AppView) => void;
}

const Onboarding: React.FC<OnboardingProps> = ({ onSelect }) => {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 overflow-hidden relative">
      {/* Blobs Decorativos */}
      <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-red-100 rounded-full blur-3xl opacity-50"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-64 h-64 bg-orange-100 rounded-full blur-3xl opacity-50"></div>

      <div className="max-w-md w-full space-y-12 text-center relative z-10">
        <div className="flex flex-col items-center">
          {/* Ícone acima removido conforme solicitação anterior */}
          <div className="flex items-center justify-center gap-2 mb-4">
            <h1 className="text-5xl font-black text-gray-900 tracking-tighter italic">
              PEDE<span className="text-red-600 underline decoration-4 underline-offset-8">AÍ</span>
            </h1>
            <Zap className="text-red-600 fill-red-600" size={40} />
          </div>
          <p className="text-gray-500 font-bold uppercase tracking-[0.2em] text-xs">O Marketplace de Comida Definitivo</p>
        </div>

        <div className="space-y-4">
          <RoleCard 
            onClick={() => onSelect(AppView.CUSTOMER)}
            icon={<ShoppingBag size={28} />}
            title="Cliente com Fome"
            description="Explore mais de 1000 restaurantes"
            color="red"
          />

          <RoleCard 
            onClick={() => onSelect(AppView.COURIER)}
            icon={<Truck size={28} />}
            title="Entregador Ágil"
            description="Ganhe dinheiro entregando na sua cidade"
            color="gray"
          />

          <RoleCard 
            onClick={() => onSelect(AppView.ADMIN)}
            icon={<BarChart3 size={28} />}
            title="Parceiro Lojista"
            description="Gerencie sua loja e cardápio"
            color="blue"
          />
        </div>

        <div className="pt-10">
          <p className="text-[10px] text-gray-300 font-black uppercase tracking-[0.3em] mb-4">
            Ecossistema Unificado v3.0
          </p>
          <div className="flex justify-center gap-2">
            {[1, 2, 3].map(i => <div key={i} className={`w-2 h-2 rounded-full ${i === 1 ? 'bg-red-600 w-6' : 'bg-gray-200'}`} />)}
          </div>
        </div>
      </div>
    </div>
  );
};

const RoleCard = ({ icon, title, description, onClick, color }: any) => {
  const colorClasses: any = {
    red: 'bg-red-50 text-red-600 border-red-100 hover:border-red-500',
    gray: 'bg-gray-50 text-gray-900 border-gray-100 hover:border-gray-900',
    blue: 'bg-blue-50 text-blue-600 border-blue-100 hover:border-blue-600',
  };

  return (
    <button 
      onClick={onClick}
      className={`w-full group bg-white p-7 rounded-[2.5rem] shadow-sm border-2 transition-all flex items-center justify-between text-left active:scale-95 ${colorClasses[color]}`}
    >
      <div className="flex items-center">
        <div className={`p-4 rounded-3xl mr-5 group-hover:scale-110 transition-transform ${colorClasses[color]}`}>
          {icon}
        </div>
        <div>
          <h3 className="font-black text-lg leading-tight">{title}</h3>
          <p className="text-sm text-gray-400 font-medium">{description}</p>
        </div>
      </div>
      <ChevronRight className="text-gray-300 group-hover:translate-x-1 transition-transform" />
    </button>
  );
};

export default Onboarding;
