import { supabase } from './supabase';
import { Order, Message, Product } from '../types';

export const createOrder = async (order: Omit<Order, 'id' | 'createdAt'>): Promise<Order | null> => {
    const { data, error } = await supabase
        .from('orders')
        .insert([{
            customer_id: order.customerId,
            store_id: order.store_id,
            status: order.status,
            total: order.total,
            items: order.items,
            address: order.address
        }])
        .select()
        .single();

    if (error) {
        console.error('Error creating order:', error);
        return null;
    }

    return {
        id: data.id,
        customerId: data.customer_id,
        store_id: data.store_id,
        status: data.status,
        total: data.total,
        items: data.items,
        createdAt: data.created_at,
        address: data.address
    };
};

export const getOrdersByCustomer = async (customerId: string): Promise<Order[]> => {
    const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching orders:', error);
        return [];
    }

    return data.map(d => ({
        id: d.id,
        customerId: d.customer_id,
        store_id: d.store_id,
        status: d.status,
        total: d.total,
        items: d.items,
        createdAt: d.created_at,
        address: d.address
    }));
};

export const getOrdersByStore = async (storeId: string): Promise<Order[]> => {
    const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('store_id', storeId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching store orders:', error);
        return [];
    }

    return data.map(d => ({
        id: d.id,
        customerId: d.customer_id,
        store_id: d.store_id,
        status: d.status,
        total: d.total,
        items: d.items,
        createdAt: d.created_at,
        address: d.address
    }));
};

export const updateOrderStatus = async (orderId: string, status: Order['status']): Promise<boolean> => {
    const { error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', orderId);

    if (error) {
        console.error('Error updating order status:', error);
        return false;
    }
    return true;
};

export const subscribeToStoreOrders = (storeId: string, callback: (order: Order, eventType: 'INSERT' | 'UPDATE') => void) => {
    return supabase
        .channel(`store_orders:${storeId}`)
        .on('postgres_changes', {
            event: '*', // Listen for all changes (INSERT, UPDATE)
            schema: 'public',
            table: 'orders',
            filter: `store_id=eq.${storeId}`
        }, (payload) => {
            const d = payload.new as any;
            const eventType = payload.eventType as 'INSERT' | 'UPDATE';
            callback({
                id: d.id,
                customerId: d.customer_id,
                store_id: d.store_id,
                status: d.status,
                total: d.total,
                items: d.items,
                createdAt: d.created_at,
                address: d.address
            }, eventType);
        })
        .subscribe();
};

export const subscribeToCustomerOrders = (customerId: string, callback: (order: Order, eventType: 'INSERT' | 'UPDATE') => void) => {
    return supabase
        .channel(`customer_orders:${customerId}`)
        .on('postgres_changes', {
            event: '*', // Listen for INSERT and UPDATE
            schema: 'public',
            table: 'orders',
            filter: `customer_id=eq.${customerId}`
        }, (payload) => {
            const d = payload.new as any;
            const eventType = payload.eventType as 'INSERT' | 'UPDATE';
            callback({
                id: d.id,
                customerId: d.customer_id,
                store_id: d.store_id,
                status: d.status,
                total: d.total,
                items: d.items,
                createdAt: d.created_at,
                address: d.address
            }, eventType);
        })
        .subscribe();
};

export const getOrderMessages = async (orderId: string, customerId: string): Promise<Message[]> => {
    const { data, error } = await supabase
        .from('order_messages')
        .select('*')
        .eq('order_id', orderId)
        .order('created_at', { ascending: true });

    if (error) {
        console.error('Error fetching order messages:', error);
        return [];
    }

    return data.map(d => ({
        id: d.id,
        order_id: d.order_id,
        sender_id: d.sender_id,
        text: d.text,
        sender: d.sender_id === customerId ? 'user' : 'store',
        timestamp: new Date(d.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        created_at: d.created_at
    }));
};

export const sendOrderMessage = async (orderId: string, senderId: string, text: string): Promise<Message | null> => {
    const { data, error } = await supabase
        .from('order_messages')
        .insert([{
            order_id: orderId,
            sender_id: senderId,
            text: text
        }])
        .select()
        .single();

    if (error) {
        console.error('Error sending order message:', error);
        return null;
    }

    return {
        id: data.id,
        order_id: data.order_id,
        sender_id: data.sender_id,
        text: data.text,
        sender: 'user', // Temporary, components should override this
        timestamp: new Date(data.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        created_at: data.created_at
    };
};

export const subscribeToOrderMessages = (orderId: string, callback: (message: Message) => void) => {
    return supabase
        .channel(`order_messages:${orderId}`)
        .on('postgres_changes', {
            event: 'INSERT',
            schema: 'public',
            table: 'order_messages',
            filter: `order_id=eq.${orderId}`
        }, (payload) => {
            const d = payload.new;
            callback({
                id: d.id,
                order_id: d.order_id,
                sender_id: d.sender_id,
                text: d.text,
                sender: 'store', // Temporary, components should override this
                timestamp: new Date(d.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                created_at: d.created_at
            });
        })
        .subscribe();
};
