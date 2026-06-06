import { SupabaseService } from '../../supabase/supabase.service';
export declare class AdminService {
    private supabase;
    constructor(supabase: SupabaseService);
    getAllUsers(): Promise<{
        success: boolean;
        data: import("@supabase/auth-js").User[];
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
}
