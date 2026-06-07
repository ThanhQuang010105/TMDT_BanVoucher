import { VouchersService } from './vouchers.service';
import { SearchVoucherDto } from './dto/search-voucher.dto';
import { CreateVoucherDto } from './dto/create-voucher.dto';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';
export declare class VouchersController {
    private readonly vouchersService;
    constructor(vouchersService: VouchersService);
    getHomepage(): Promise<{
        categories: {
            ma_taxon: any;
            ten_taxon: any;
            ma_taxonomy: any;
        }[];
        featured_vouchers: {
            ma_voucher: any;
            ten_voucher: any;
            mo_ta: any;
            gia_goc: any;
            gia_ban: any;
            so_luong_phat_hanh: any;
            so_luong_da_ban: any;
            ngay_bd: any;
            ngay_kt: any;
            link_voucher_banner: any;
            doi_tac: {
                ten_doanh_nghiep: any;
            }[];
        }[];
    }>;
    getCategories(): Promise<{
        data: {
            ma_taxon: any;
            ten_taxon: any;
            ma_taxon_cha: any;
            ma_taxonomy: any;
            thu_tu_hien_thi: any;
        }[];
    }>;
    getPhanLoai(): Promise<{
        data: {
            ma_pl: any;
            ten_loai_voucher: any;
            mo_ta: any;
        }[];
    }>;
    searchVouchers(dto: SearchVoucherDto): Promise<{
        data: {
            ma_voucher: any;
            ten_voucher: any;
            mo_ta: any;
            gia_goc: any;
            gia_ban: any;
            so_luong_phat_hanh: any;
            so_luong_da_ban: any;
            ngay_bd: any;
            ngay_kt: any;
            link_voucher_banner: any;
            doi_tac: {
                ma_dt: any;
                ten_doanh_nghiep: any;
            }[];
            danh_muc: {
                ma_taxon: any;
                ten_taxon: any;
            }[];
        }[];
        pagination: {
            total: number;
            page: number;
            limit: number;
            total_pages: number;
        };
    }>;
    getVoucherDetail(maVoucher: string): Promise<{
        data: {
            ton_kho: number;
            chi_nhanh: {
                ma_cn: any;
                ten_chi_nhanh: any;
                dia_chi: any;
            }[];
            danh_gia: {
                ma_dg: any;
                diem_so_dg: any;
                noi_dung_binh_luan: any;
                ngay_danh_gia: any;
                khach_hang: {
                    ho_ten: any;
                }[];
            }[];
            diem_trung_binh: string | null;
            so_luong_danh_gia: number;
            ma_voucher: any;
            ten_voucher: any;
            mo_ta: any;
            gia_goc: any;
            gia_ban: any;
            so_luong_phat_hanh: any;
            so_luong_da_ban: any;
            ngay_bd: any;
            ngay_kt: any;
            trang_thai: any;
            link_voucher_banner: any;
            doi_tac: {
                ma_dt: any;
                ten_doanh_nghiep: any;
                nguoi_dai_dien: any;
            }[];
            danh_muc: {
                ma_taxon: any;
                ten_taxon: any;
            }[];
            phan_loai: {
                ma_pl: any;
                ten_loai_voucher: any;
            }[];
        };
    }>;
    getAllVouchers(userId: string): Promise<{
        success: boolean;
        data: any[];
    }>;
    searchVoucherForAdmin(userId: string, query: any): Promise<{
        success: boolean;
        total: number;
        data: any[];
    }>;
    getBranches(maDT: string): Promise<{
        success: boolean;
        data: any[];
    }>;
    create(userId: string, dto: CreateVoucherDto): Promise<{
        success: boolean;
        data: any;
        message: string;
    }>;
    submitVoucher(userId: string, id: string): Promise<{
        success: boolean;
        data: any;
        message: string;
    }>;
    approveVoucher(userId: string, id: string): Promise<{
        success: boolean;
        data: any;
        message: string;
    }>;
    rejectVoucher(userId: string, id: string): Promise<{
        success: boolean;
        data: any;
        message: string;
    }>;
    uploadBanner(file: any): Promise<{
        success: boolean;
        data: {
            bannerUrl: string;
        };
        message: string;
    }>;
    update(userId: string, id: string, payload: any): Promise<{
        success: boolean;
        data: any;
        message: string;
    }>;
    remove(userId: string, id: string): Promise<{
        success: boolean;
        message: string;
    }>;
    createBranch(dto: CreateBranchDto): Promise<{
        success: boolean;
        data: any;
        message: string;
    }>;
    updateBranch(maCN: string, dto: UpdateBranchDto): Promise<{
        success: boolean;
        data: any;
        message: string;
    }>;
    deleteBranch(maCN: string): Promise<{
        success: boolean;
        message: string;
    }>;
}
