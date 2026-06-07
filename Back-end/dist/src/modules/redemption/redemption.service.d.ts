import { SupabaseService } from '../../supabase/supabase.service';
export declare class RedemptionService {
    private supabase;
    constructor(supabase: SupabaseService);
    verifyVoucherCode(ma_voucher_code: string, ma_cn: string): Promise<{
        success: boolean;
        data: any;
        message: string;
    }>;
    redeemVoucherCode(ma_voucher_code: string, ma_cn: string, userId?: string): Promise<{
        success: boolean;
        data: any;
        message: string;
    }>;
    getPurchaseHistory(ma_kh: string): Promise<{
        success: boolean;
        data: any[];
        message: string;
    }>;
    getPartnerStats(ma_dt: string): Promise<{
        success: boolean;
        data: {
            vouchers: {
                ma_voucher: any;
                ten_voucher: any;
                gia_ban: any;
                so_luong_phat_hanh: any;
                so_luong_da_ban: any;
                trang_thai: any;
            }[];
            tong_da_ban: any;
            tong_doanh_thu_tam_tinh: number;
        };
        message: string;
    }>;
    getAdminStats(): Promise<{
        success: boolean;
        data: {
            tong_voucher_da_ban: any;
            tong_don_hang: number;
            tong_doanh_thu: number;
        };
        message: string;
    }>;
}
