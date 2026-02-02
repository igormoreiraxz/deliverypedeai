import { supabase } from './supabase';
import { Store } from '../types';

export const getRegisteredStores = async (): Promise<Store[]> => {
    const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, rating, delivery_time, image_url, category')
        .eq('role', 'store');

    if (error) {
        console.error('Error fetching stores:', error);
        return [];
    }

    // Map database fields to Store interface
    return (data || []).map(item => ({
        id: item.id,
        name: item.full_name || 'Loja sem nome',
        rating: Number(item.rating) || 5.0,
        deliveryTime: item.delivery_time || '30-40 min',
        image: item.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80',
        category: item.category || 'Geral'
    }));
};
