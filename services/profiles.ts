import { supabase } from './supabase';

export interface Profile {
    id: string;
    email: string;
    role: 'client' | 'store' | 'courier';
    full_name: string;
    cnpj?: string;
    cnh?: string;
    image_url?: string;
    category?: string;
    delivery_time?: string;
    rating?: number;
}

export const getCurrentProfile = async (): Promise<Profile | null> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    if (error) {
        console.error('Error fetching profile:', error);
        return null;
    }

    return data;
};
