export interface Customer {
    id: string;          // Khớp với cột UUID trong Supabase
    full_name: string;
    email: string;
    phone_number?: string;
    created_at: string;
}