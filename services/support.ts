import { supabase } from './supabase';

export interface SupportMessage {
    id: string;
    user_id: string;
    staff_id?: string;
    text: string;
    sender_type: 'user' | 'staff';
    created_at: string;
}

export const getSupportMessages = async (userId: string): Promise<SupportMessage[]> => {
    const { data, error } = await supabase
        .from('support_messages')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

    if (error) {
        console.error('Error fetching support messages:', error);
        return [];
    }

    return data || [];
};

export const sendSupportMessage = async (
    userId: string,
    text: string,
    senderType: 'user' | 'staff'
): Promise<SupportMessage | null> => {
    const { data, error } = await supabase
        .from('support_messages')
        .insert([{ user_id: userId, text, sender_type: senderType }])
        .select()
        .single();

    if (error) {
        console.error('Error sending support message:', error);
        return null;
    }

    return data;
};

export const subscribeToSupportMessages = (userId: string, onMessage: (message: SupportMessage) => void) => {
    return supabase
        .channel(`support_${userId}`)
        .on(
            'postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'support_messages', filter: `user_id=eq.${userId}` },
            (payload) => {
                onMessage(payload.new as SupportMessage);
            }
        )
        .subscribe();
};
