import { AdminService } from './admin.service';
export declare class AdminController {
    private readonly adminService;
    constructor(adminService: AdminService);
    getAllUsers(): Promise<{
        success: boolean;
        data: import("@supabase/auth-js").User[];
        message: string;
    }>;
    banUser(id: string): Promise<{
        success: boolean;
        data: {
            user: import("@supabase/auth-js").User;
        };
        message: string;
    }>;
    unbanUser(id: string): Promise<{
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
    approveVoucher(id: string): Promise<{
        success: boolean;
        data: any;
        message: string;
    }>;
    rejectVoucher(id: string): Promise<{
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
