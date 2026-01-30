
import React, { useState, useEffect } from 'react';
import { AppView, Order, Message } from './types';
import Onboarding from './components/Onboarding';
import CustomerApp from './components/CustomerApp';
import CourierApp from './components/CourierApp';
import AdminPanel from './components/AdminPanel';
import LoginClient from './components/auth/LoginClient';
import LoginStore from './components/auth/LoginStore';
import LoginCourier from './components/auth/LoginCourier';
import { supabase } from './services/supabase';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.ONBOARDING);
  const [selectedRole, setSelectedRole] = useState<AppView | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check active session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        handleProfileRedirect(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        handleProfileRedirect(session.user.id);
      } else {
        setCurrentView(AppView.ONBOARDING);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleProfileRedirect = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();

    if (!error && data) {
      if (data.role === 'client') setCurrentView(AppView.CUSTOMER);
      else if (data.role === 'store') setCurrentView(AppView.ADMIN);
      else if (data.role === 'courier') setCurrentView(AppView.COURIER);
    }
    setLoading(false);
  };

  const resetToOnboarding = async () => {
    await supabase.auth.signOut();
    setCurrentView(AppView.ONBOARDING);
    setSelectedRole(null);
  };

  const handleRoleSelect = (role: AppView) => {
    setSelectedRole(role);
    setCurrentView(AppView.LOGIN);
  };

  const handleLoginSuccess = (role: AppView) => {
    setCurrentView(role);
  };

  const addOrder = (newOrder: Order) => {
    setOrders(prev => [newOrder, ...prev]);
  };

  const updateOrderStatus = (orderId: string, status: Order['status'], courierId?: string) => {
    setOrders(prev => prev.map(order =>
      order.id === orderId ? { ...order, status, courierId: courierId || order.courierId } : order
    ));
  };

  const deleteOrder = (orderId: string) => {
    setOrders(prev => prev.filter(order => order.id !== orderId));
  };

  const sendMessage = (orderId: string, text: string, sender: 'user' | 'store') => {
    const newMessage: Message = {
      id: Date.now().toString(),
      orderId,
      text,
      sender,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, newMessage]);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-red-600">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden">
      <div className="animate-in fade-in duration-500">
        {currentView === AppView.ONBOARDING && (
          <Onboarding onSelect={handleRoleSelect} />
        )}

        {currentView === AppView.LOGIN && selectedRole === AppView.CUSTOMER && (
          <LoginClient onBack={resetToOnboarding} onLoginSuccess={handleLoginSuccess} />
        )}

        {currentView === AppView.LOGIN && selectedRole === AppView.ADMIN && (
          <LoginStore onBack={resetToOnboarding} onLoginSuccess={handleLoginSuccess} />
        )}

        {currentView === AppView.LOGIN && selectedRole === AppView.COURIER && (
          <LoginCourier onBack={resetToOnboarding} onLoginSuccess={handleLoginSuccess} />
        )}

        {currentView === AppView.CUSTOMER && (
          <CustomerApp
            onSwitchMode={resetToOnboarding}
            onPlaceOrder={addOrder}
            orders={orders}
            messages={messages}
            onSendMessage={sendMessage}
          />
        )}

        {currentView === AppView.COURIER && (
          <CourierApp
            onSwitchMode={resetToOnboarding}
            orders={orders}
            onUpdateOrder={updateOrderStatus}
          />
        )}

        {currentView === AppView.ADMIN && (
          <AdminPanel
            onSwitchMode={resetToOnboarding}
            orders={orders}
            onUpdateOrder={updateOrderStatus}
            onDeleteOrder={deleteOrder}
            messages={messages}
            onSendMessage={sendMessage}
          />
        )}
      </div>
    </div>
  );
};

export default App;
