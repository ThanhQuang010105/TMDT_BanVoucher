import { SupabaseService } from '../../supabase/supabase.service';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { CreateOrderDto } from './dto/create-order.dto';
import { CreateReviewDto } from './dto/create-review.dto';
import { CreateComplaintDto } from './dto/create-complaint.dto';
export declare class OrdersService {
    private readonly supabaseService;
    constructor(supabaseService: SupabaseService);
    private getKhachHang;
    getCart(accessToken: string): Promise<{
        data: {
            ma_ctgh: any;
            so_luong_mua: any;
            voucher: {
                ma_voucher: any;
                ten_voucher: any;
                gia_goc: any;
                gia_ban: any;
                ngay_kt: any;
                so_luong_phat_hanh: any;
                so_luong_da_ban: any;
                link_voucher_banner: any;
            }[];
        }[];
        tong_tien: number;
    }>;
    addToCart(accessToken: string, dto: AddToCartDto): Promise<{
        message: string;
    }>;
    removeFromCart(accessToken: string, maCtgh: string): Promise<{
        message: string;
    }>;
    updateCartQuantity(accessToken: string, maCtgh: string, soLuongMua: number): Promise<{
        message: string;
    } | {
        success: boolean;
        message: string;
    }>;
    createOrder(accessToken: string, dto: CreateOrderDto): Promise<{
        message: string;
        ma_dh: string;
        tong_tien: number;
        so_voucher_code_phat_hanh: number;
    }>;
    getMyVouchers(accessToken: string, trang_thai?: string): Promise<{
        data: {
            ma_voucher_code: any;
            trang_thai: any;
            ngay_su_dung: any;
            chuoi_ma_bao_mat: any;
            voucher: {
                ma_voucher: any;
                ten_voucher: any;
                gia_ban: any;
                ngay_kt: any;
                link_voucher_banner: any;
                doi_tac: {
                    ten_doanh_nghiep: any;
                }[];
            }[];
            don_hang: {
                ma_dh: any;
                ngay_tao_don: any;
            }[];
        }[];
    }>;
    getVoucherCodeDetail(accessToken: string, maVoucherCode: string): Promise<{
        data: {
            ma_voucher_code: any;
            trang_thai: any;
            ngay_su_dung: any;
            chuoi_ma_bao_mat: any;
            voucher: {
                ma_voucher: any;
                ten_voucher: any;
                gia_goc: any;
                gia_ban: any;
                ngay_kt: any;
                mo_ta: any;
                link_voucher_banner: any;
                doi_tac: {
                    ten_doanh_nghiep: any;
                }[];
                chi_nhanh: {
                    chi_nhanh: {
                        ten_chi_nhanh: any;
                        dia_chi: any;
                    }[];
                }[];
            }[];
            don_hang: {
                ma_dh: any;
                ngay_tao_don: any;
                phuong_thuc_thanh_toan: any;
            }[];
        };
    }>;
    createReview(accessToken: string, dto: CreateReviewDto): Promise<{
        message: string;
        ma_dg: string;
    }>;
    getOrderHistory(accessToken: string): Promise<{
        data: {
            ma_dh: any;
            ten_don_hang: any;
            tong_tien: any;
            phuong_thuc_thanh_toan: any;
            trang_thai_thanh_toan: any;
            ngay_tao_don: any;
            chi_tiet_don_hang: {
                so_luong_mua: any;
                don_gia_mua: any;
                voucher: {
                    ten_voucher: any;
                }[];
            }[];
        }[];
    }>;
    cancelOrder(accessToken: string, maDh: string): Promise<{
        success: boolean;
        message: string;
        ma_ls: string;
    }>;
    createComplaint(accessToken: string, dto: CreateComplaintDto): Promise<{
        success: boolean;
        data: any;
        message: string;
    }>;
    deleteReview(accessToken: string, maDanhGia: string): Promise<{
        success: boolean;
        message: string;
    }>;
    getStripeConfig(): {
        success: boolean;
        publishableKey: string | undefined;
    };
    createStripeCheckoutSession(accessToken: string, emailNhanVoucher?: string, maCtghList?: string[]): Promise<{
        url: string;
    }>;
    handleStripeSuccess(accessToken: string, sessionId: string): Promise<{
        ma_dh: any;
        tong_tien: number;
    }>;
}
