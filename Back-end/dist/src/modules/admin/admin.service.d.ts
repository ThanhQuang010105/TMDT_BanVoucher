import { SupabaseService } from '../../supabase/supabase.service';
export declare class AdminService {
    private supabase;
    constructor(supabase: SupabaseService);
    getAllUsers(): Promise<{
        success: boolean;
        data: {
            db_role: any;
            db_status: any;
            id: string;
            app_metadata: import("@supabase/auth-js").UserAppMetadata;
            user_metadata: import("@supabase/auth-js").UserMetadata;
            aud: string;
            confirmation_sent_at?: string;
            recovery_sent_at?: string;
            email_change_sent_at?: string;
            new_email?: string;
            new_phone?: string;
            invited_at?: string;
            action_link?: string;
            email?: string;
            phone?: string;
            created_at: string;
            confirmed_at?: string;
            email_confirmed_at?: string;
            phone_confirmed_at?: string;
            last_sign_in_at?: string;
            role?: string;
            updated_at?: string;
            identities?: import("@supabase/auth-js").UserIdentity[];
            is_anonymous?: boolean;
            is_sso_user?: boolean;
            factors?: (import("@supabase/auth-js").Factor<import("@supabase/auth-js").FactorType, "verified"> | import("@supabase/auth-js").Factor<import("@supabase/auth-js").FactorType, "unverified">)[];
            deleted_at?: string;
            banned_until?: string;
        }[];
        message: string;
    }>;
    banUser(userId: string): Promise<{
        success: boolean;
        data: {
            user: import("@supabase/auth-js").User;
        };
        message: string;
    }>;
    unbanUser(userId: string): Promise<{
        success: boolean;
        data: {
            user: import("@supabase/auth-js").User;
        };
        message: string;
    }>;
    deleteUser(userId: string): Promise<{
        success: boolean;
        message: string;
    }>;
    getPendingVouchers(): Promise<{
        success: boolean;
        data: any[];
        message: string;
    }>;
    approveVoucher(voucherId: string): Promise<{
        success: boolean;
        data: any;
        message: string;
    }>;
    rejectVoucher(voucherId: string): Promise<{
        success: boolean;
        data: any;
        message: string;
    }>;
    hideVoucher(voucherId: string): Promise<{
        success: boolean;
        data: any;
        message: string;
    }>;
    activateVoucher(voucherId: string): Promise<{
        success: boolean;
        data: any;
        message: string;
    }>;
    deleteVoucher(voucherId: string): Promise<{
        success: boolean;
        message: string;
    }>;
    getPendingPartners(): Promise<{
        success: boolean;
        data: any[];
        message: string;
    }>;
    approvePartner(maDT: string): Promise<{
        success: boolean;
        message: string;
    }>;
    rejectPartner(maDT: string): Promise<{
        success: boolean;
        message: string;
    }>;
    lockPartner(maDT: string): Promise<{
        success: boolean;
        message: string;
    }>;
    unlockPartner(maDT: string): Promise<{
        success: boolean;
        message: string;
    }>;
    getAllComplaints(): Promise<{
        success: boolean;
        data: any[];
    }>;
    resolveComplaint(maKN: string, ketQuaXL: string): Promise<{
        success: boolean;
        data: any;
        message: string;
    }>;
    getSystemLogs(): Promise<{
        success: boolean;
        data: any[];
    }>;
    getAllOrders(): Promise<{
        success: boolean;
        data: any[];
        message: string;
    }>;
    getDashboardStats(): Promise<{
        success: boolean;
        data: {
            totalRevenue: number;
            usersCount: number;
            vouchersCount: number;
            ordersCount: number;
            revenueChart: {
                label: string;
                value: number;
            }[];
        };
    }>;
}
