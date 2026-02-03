import { supabase } from './supabase';
import { Order } from '../types';

/**
 * Get all available deliveries (ready orders without assigned courier)
 */
export const getAvailableDeliveries = async (): Promise<Order[]> => {
    const { data, error } = await supabase
        .from('orders')
        .select(`
      *,
      items
    `)
        .eq('status', 'ready')
        .is('courier_id', null)
        .order('created_at', { ascending: true });

    if (error) {
        console.error('Error fetching available deliveries:', error);
        return [];
    }

    return data.map(order => ({
        id: order.id,
        customerId: order.customer_id,
        store_id: order.store_id,
        items: order.items,
        status: order.status,
        total: parseFloat(order.total),
        createdAt: order.created_at,
        address: order.address,
        courierId: order.courier_id
    }));
};

/**
 */
export const claimDelivery = async (orderId: string, courierId: string): Promise<boolean> => {
    // Verify user ID matches courierId to prevent auth errors
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.id !== courierId) {
        console.error('Auth mismatch: Attempting to claim for different user');
        return false;
    }

    // Use Supabase RPC or direct update with conditions to prevent race conditions
    const { data, error } = await supabase
        .from('orders')
        .update({
            courier_id: courierId,
            status: 'accepted'
        })
        .eq('id', orderId)
        .eq('status', 'ready')
        .is('courier_id', null)
        .select();

    if (error) {
        console.error('Error claiming delivery:', error);
        return false;
    }

    // If no rows were updated, it means another courier claimed it first
    return data && data.length > 0;
};

/**
 * Confirm collection of order (change status from accepted to shipping)
 */
export const confirmCollection = async (orderId: string, courierId: string): Promise<boolean> => {
    const { error } = await supabase
        .from('orders')
        .update({ status: 'shipping' })
        .eq('id', orderId)
        .eq('courier_id', courierId)
        .eq('status', 'accepted');

    if (error) {
        console.error('Error confirming collection:', error);
        return false;
    }

    return true;
};

/**
 * Update courier's current location
 */
export const updateCourierLocation = async (
    courierId: string,
    latitude: number,
    longitude: number
): Promise<boolean> => {
    const { error } = await supabase
        .from('profiles')
        .update({ latitude, longitude })
        .eq('id', courierId);

    if (error) {
        console.error('Error updating courier location:', error);
        return false;
    }

    return true;
};

/**
 * Update courier's online/offline status
 */
export const updateCourierStatus = async (
    courierId: string,
    isOnline: boolean
): Promise<boolean> => {
    const { error } = await supabase
        .from('profiles')
        .update({ is_online: isOnline })
        .eq('id', courierId);

    if (error) {
        console.error('Error updating courier status:', error);
        return false;
    }

    return true;
};

/**
 * Subscribe to available deliveries in real-time
 * Triggers callback when new orders become ready or when orders are claimed
 */
export const subscribeToAvailableDeliveries = (
    callback: (order: Order, eventType: 'INSERT' | 'UPDATE' | 'DELETE') => void
) => {
    const subscription = supabase
        .channel('available-deliveries')
        .on(
            'postgres_changes',
            {
                event: '*',
                schema: 'public',
                table: 'orders',
                filter: 'status=eq.ready'
            },
            (payload) => {
                const eventType = payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE';

                if (payload.new && typeof payload.new === 'object') {
                    const order = payload.new as any;

                    // Only notify if courier_id is null (available for claim)
                    if (order.courier_id === null) {
                        callback({
                            id: order.id,
                            customerId: order.customer_id,
                            store_id: order.store_id,
                            items: order.items,
                            status: order.status,
                            total: parseFloat(order.total),
                            createdAt: order.created_at,
                            address: order.address,
                            courierId: order.courier_id
                        }, eventType);
                    }
                }

                // Handle DELETE events (order claimed or cancelled)
                if (eventType === 'DELETE' && payload.old) {
                    const order = payload.old as any;
                    callback({
                        id: order.id,
                        customerId: order.customer_id,
                        store_id: order.store_id,
                        items: order.items,
                        status: order.status,
                        total: parseFloat(order.total),
                        createdAt: order.created_at,
                        address: order.address,
                        courierId: order.courier_id
                    }, 'DELETE');
                }
            }
        )
        .subscribe();

    return subscription;
};

/**
 * Get courier's active delivery (order in shipping status assigned to them)
 */
export const getCourierActiveDelivery = async (courierId: string): Promise<Order | null> => {
    const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('courier_id', courierId)
        .in('status', ['accepted', 'shipping'])
        .single();

    if (error || !data) {
        return null;
    }

    return {
        id: data.id,
        customerId: data.customer_id,
        store_id: data.store_id,
        items: data.items,
        status: data.status,
        total: parseFloat(data.total),
        createdAt: data.created_at,
        address: data.address,
        courierId: data.courier_id
    };
};

/**
 * Get courier's delivery history
 */
export const getCourierDeliveryHistory = async (courierId: string): Promise<Order[]> => {
    const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('courier_id', courierId)
        .eq('status', 'delivered')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching courier history:', error);
        return [];
    }

    return data.map(order => ({
        id: order.id,
        customerId: order.customer_id,
        store_id: order.store_id,
        items: order.items,
        status: order.status,
        total: parseFloat(order.total),
        createdAt: order.created_at,
        address: order.address,
        courierId: order.courier_id
    }));
};

/**
 * Complete delivery (change status from shipping to delivered)
 */
export const completeDelivery = async (orderId: string, courierId: string): Promise<boolean> => {
    const { error } = await supabase
        .from('orders')
        .update({ status: 'delivered' })
        .eq('id', orderId)
        .eq('courier_id', courierId)
        .eq('status', 'shipping');

    if (error) {
        console.error('Error completing delivery:', error);
        return false;
    }

    return true;
};
