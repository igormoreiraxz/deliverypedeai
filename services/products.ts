import { supabase } from './supabase';
import { Product } from '../types';

export const getProductsByStore = async (storeId: string): Promise<Product[]> => {
    const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('store_id', storeId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching products:', error);
        return [];
    }

    return data || [];
};

export const getAllProducts = async (): Promise<Product[]> => {
    const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching all products:', error);
        return [];
    }

    return data || [];
};

export const addProduct = async (product: Omit<Product, 'id'>, storeId: string): Promise<Product | null> => {
    const { data, error } = await supabase
        .from('products')
        .insert([{ ...product, store_id: storeId }])
        .select()
        .single();

    if (error) {
        console.error('Error adding product:', error);
        return null;
    }

    return data;
};

export const deleteProduct = async (productId: string): Promise<boolean> => {
    const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

    if (error) {
        console.error('Error deleting product:', error);
        return false;
    }

    return true;
};
