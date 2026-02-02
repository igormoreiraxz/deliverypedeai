import { supabase } from './supabase';

export const uploadProductImage = async (file: File, storeId: string): Promise<string | null> => {
    try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${storeId}/${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('product-images')
            .upload(filePath, file);

        if (uploadError) {
            throw uploadError;
        }

        const { data } = supabase.storage
            .from('product-images')
            .getPublicUrl(filePath);

        return data.publicUrl;
    } catch (error) {
        console.error('Error uploading product image:', error);
        return null;
    }
};
