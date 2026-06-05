-- Script khởi tạo database của dự án
-- =========================================================================
-- XÓA BẢNG NẾU ĐÃ TỒN TẠI (Để dễ dàng chạy lại toàn bộ script khi test)
-- =========================================================================
DROP TABLE IF EXISTS public.lich_su_giao_dich CASCADE;
DROP TABLE IF EXISTS public.voucher_phat_hanh CASCADE;
DROP TABLE IF EXISTS public.chi_tiet_don_hang CASCADE;
DROP TABLE IF EXISTS public.don_hang CASCADE;
DROP TABLE IF EXISTS public.chi_tiet_gio_hang CASCADE;
DROP TABLE IF EXISTS public.danh_gia CASCADE;
DROP TABLE IF EXISTS public.khieu_nai CASCADE;
DROP TABLE IF EXISTS public.voucher CASCADE;
DROP TABLE IF EXISTS public.phan_loai CASCADE;
DROP TABLE IF EXISTS public.danh_muc CASCADE;
DROP TABLE IF EXISTS public.cay_danh_muc CASCADE;
DROP TABLE IF EXISTS public.doi_soat CASCADE;
DROP TABLE IF EXISTS public.chi_nhanh CASCADE;
DROP TABLE IF EXISTS public.doi_tac CASCADE;
DROP TABLE IF EXISTS public.khach_hang CASCADE;
DROP TABLE IF EXISTS public.nhat_ky_he_thong CASCADE;
DROP TABLE IF EXISTS public.tai_khoan CASCADE;

-- =========================================================================
-- TẠO BẢNG & KHÓA CHÍNH (PRIMARY KEYS), KHÓA NGOẠI (FOREIGN KEYS)
-- =========================================================================

-- 1. TAI_KHOAN (Bảng mở rộng thông tin từ auth.users)
CREATE TABLE public.tai_khoan (
    ma_tk uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username text UNIQUE NOT NULL,
    vai_tro text, -- 'khach_hang', 'doi_tac', 'admin'
    trang_thai_hoat_dong text,
    ngay_tao timestamptz DEFAULT now() NOT NULL
);

-- 2. NHAT_KY_HE_THONG
CREATE TABLE public.nhat_ky_he_thong (
    ma_nk text PRIMARY KEY,
    ma_tk uuid NOT NULL,
    hanh_dong text NOT NULL,
    thoi_gian timestamptz DEFAULT now() NOT NULL,
    CONSTRAINT fk_nhatky_taikhoan FOREIGN KEY (ma_tk) REFERENCES public.tai_khoan(ma_tk) ON DELETE CASCADE
);

-- 3. KHACH_HANG
CREATE TABLE public.khach_hang (
    ma_kh text PRIMARY KEY,
    ma_tk uuid NOT NULL UNIQUE, 
    ho_ten text NOT NULL,
    sdt varchar(20),
    dia_chi text,
    email text,
    CONSTRAINT fk_kh_taikhoan FOREIGN KEY (ma_tk) REFERENCES public.tai_khoan(ma_tk) ON DELETE CASCADE
);

-- 4. DOI_TAC
CREATE TABLE public.doi_tac (
    ma_dt text PRIMARY KEY,
    ma_tk uuid NOT NULL UNIQUE,
    ten_doanh_nghiep text NOT NULL,
    nguoi_dai_dien text,
    ma_so_thue varchar(50) UNIQUE,
    trang_thai_duyet text,
    CONSTRAINT fk_dt_taikhoan FOREIGN KEY (ma_tk) REFERENCES public.tai_khoan(ma_tk) ON DELETE CASCADE
);

-- 5. CHI_NHANH
CREATE TABLE public.chi_nhanh (
    ma_cn text PRIMARY KEY,
    ma_dt text NOT NULL,
    ten_chi_nhanh text NOT NULL,
    dia_chi text,
    trang_thai_hoat_dong text,
    CONSTRAINT fk_cn_doitac FOREIGN KEY (ma_dt) REFERENCES public.doi_tac(ma_dt) ON DELETE CASCADE
);

-- 6. DOI_SOAT
CREATE TABLE public.doi_soat (
    ma_doi_soat text PRIMARY KEY,
    ma_dt text NOT NULL,
    tu_ngay date NOT NULL,
    den_ngay date NOT NULL,
    tong_doanh_thu numeric(18,2) DEFAULT 0,
    phi_hoa_hong numeric(18,2) DEFAULT 0,
    tien_thuc_nhan numeric(18,2) DEFAULT 0,
    trang_thai text,
    ngay_thanh_toan timestamptz,
    ma_chung_tu text,
    CONSTRAINT fk_doisoat_doitac FOREIGN KEY (ma_dt) REFERENCES public.doi_tac(ma_dt) ON DELETE RESTRICT
);

-- 7. CAY_DANH_MUC (Taxonomy)
CREATE TABLE public.cay_danh_muc (
    ma_taxonomy text PRIMARY KEY,
    ten_taxonomy text NOT NULL,
    mo_ta text,
    ngay_tao timestamptz DEFAULT now() NOT NULL
);

-- 8. DANH_MUC (Taxon)
CREATE TABLE public.danh_muc (
    ma_taxon text PRIMARY KEY,
    ma_taxonomy text NOT NULL,
    ma_taxon_cha text,
    ten_taxon text NOT NULL,
    thu_tu_hien_thi int DEFAULT 0,
    CONSTRAINT fk_danhmuc_caydanhmuc FOREIGN KEY (ma_taxonomy) REFERENCES public.cay_danh_muc(ma_taxonomy) ON DELETE CASCADE,
    CONSTRAINT fk_danhmuc_dequy FOREIGN KEY (ma_taxon_cha) REFERENCES public.danh_muc(ma_taxon) ON DELETE SET NULL
);

-- 9. PHAN_LOAI
CREATE TABLE public.phan_loai (
    ma_pl text PRIMARY KEY,
    ten_loai_voucher text NOT NULL,
    trang_thai text,
    mo_ta text
);

-- 10. VOUCHER
CREATE TABLE public.voucher (
    ma_voucher text PRIMARY KEY,
    ma_dt text NOT NULL,
    ma_pl text NOT NULL,
    ma_taxon text NOT NULL,
    ten_voucher text NOT NULL,
    mo_ta text,
    gia_goc numeric(18,2) NOT NULL,
    gia_ban numeric(18,2) NOT NULL,
    so_luong_phat_hanh int DEFAULT 0,
    so_luong_da_ban int DEFAULT 0,
    ngay_bd timestamptz NOT NULL,
    ngay_kt timestamptz NOT NULL,
    trang_thai text,
    CONSTRAINT fk_voucher_doitac FOREIGN KEY (ma_dt) REFERENCES public.doi_tac(ma_dt) ON DELETE CASCADE,
    CONSTRAINT fk_voucher_phanloai FOREIGN KEY (ma_pl) REFERENCES public.phan_loai(ma_pl) ON DELETE RESTRICT,
    CONSTRAINT fk_voucher_danhmuc FOREIGN KEY (ma_taxon) REFERENCES public.danh_muc(ma_taxon) ON DELETE RESTRICT
);

-- 11. KHIEU_NAI
CREATE TABLE public.khieu_nai (
    ma_kn text PRIMARY KEY,
    ma_kh text NOT NULL,
    ma_voucher text NOT NULL,
    ly_do text NOT NULL,
    ket_qua_xl text,
    trang_thai_xl text,
    CONSTRAINT fk_khieunai_khachhang FOREIGN KEY (ma_kh) REFERENCES public.khach_hang(ma_kh) ON DELETE CASCADE,
    CONSTRAINT fk_khieunai_voucher FOREIGN KEY (ma_voucher) REFERENCES public.voucher(ma_voucher) ON DELETE CASCADE
);

-- 12. DANH_GIA
CREATE TABLE public.danh_gia (
    ma_dg text PRIMARY KEY,
    ma_kh text NOT NULL,
    ma_voucher text NOT NULL,
    diem_so_dg numeric(3,1) CHECK (diem_so_dg >= 0 AND diem_so_dg <= 5),
    noi_dung_binh_luan text,
    ngay_danh_gia timestamptz DEFAULT now() NOT NULL,
    CONSTRAINT fk_danhgia_khachhang FOREIGN KEY (ma_kh) REFERENCES public.khach_hang(ma_kh) ON DELETE CASCADE,
    CONSTRAINT fk_danhgia_voucher FOREIGN KEY (ma_voucher) REFERENCES public.voucher(ma_voucher) ON DELETE CASCADE
);

-- 13. CHI_TIET_GIO_HANG
CREATE TABLE public.chi_tiet_gio_hang (
    ma_ctgh text PRIMARY KEY,
    ma_kh text NOT NULL,
    ma_voucher text NOT NULL,
    so_luong_mua int DEFAULT 1,
    CONSTRAINT fk_gh_khachhang FOREIGN KEY (ma_kh) REFERENCES public.khach_hang(ma_kh) ON DELETE CASCADE,
    CONSTRAINT fk_gh_voucher FOREIGN KEY (ma_voucher) REFERENCES public.voucher(ma_voucher) ON DELETE CASCADE
);

-- 14. DON_HANG
CREATE TABLE public.don_hang (
    ma_dh text PRIMARY KEY,
    ma_kh text NOT NULL,
    ten_don_hang text,
    tong_tien numeric(18,2) DEFAULT 0,
    phuong_thuc_thanh_toan text,
    trang_thai_thanh_toan text,
    ngay_tao_don timestamptz DEFAULT now() NOT NULL,
    CONSTRAINT fk_dh_khachhang FOREIGN KEY (ma_kh) REFERENCES public.khach_hang(ma_kh) ON DELETE RESTRICT
);

-- 15. CHI_TIET_DON_HANG
CREATE TABLE public.chi_tiet_don_hang (
    ma_ctdh text PRIMARY KEY,
    ma_dh text NOT NULL,
    ma_voucher text NOT NULL,
    so_luong_mua int NOT NULL,
    don_gia_mua numeric(18,2) NOT NULL,
    CONSTRAINT fk_ctdh_donhang FOREIGN KEY (ma_dh) REFERENCES public.don_hang(ma_dh) ON DELETE CASCADE,
    CONSTRAINT fk_ctdh_voucher FOREIGN KEY (ma_voucher) REFERENCES public.voucher(ma_voucher) ON DELETE RESTRICT
);

-- 16. VOUCHER_PHAT_HANH
CREATE TABLE public.voucher_phat_hanh (
    ma_voucher_code text PRIMARY KEY,
    ma_voucher text NOT NULL,
    ma_dh text NOT NULL, 
    ma_cn text, 
    trang_thai text,
    ngay_su_dung timestamptz,
    chuoi_ma_bao_mat text NOT NULL,
    CONSTRAINT fk_vcode_voucher FOREIGN KEY (ma_voucher) REFERENCES public.voucher(ma_voucher) ON DELETE RESTRICT,
    CONSTRAINT fk_vcode_donhang FOREIGN KEY (ma_dh) REFERENCES public.don_hang(ma_dh) ON DELETE CASCADE,
    CONSTRAINT fk_vcode_chinhanh FOREIGN KEY (ma_cn) REFERENCES public.chi_nhanh(ma_cn) ON DELETE SET NULL
);

-- 17. LICH_SU_GIAO_DICH
CREATE TABLE public.lich_su_giao_dich (
    ma_ls text PRIMARY KEY,
    ma_dh text NOT NULL,
    so_tien numeric(18,2) NOT NULL,
    phuong_thuc_thanh_toan text,
    trang_thai_thanh_toan text,
    ma_giao_dich_cung_cap text,
    ma_loi text,
    thoi_ gian_thuc_hien timestamptz DEFAULT now() NOT NULL,
    CONSTRAINT fk_lsgd_donhang FOREIGN KEY (ma_dh) REFERENCES public.don_hang(ma_dh) ON DELETE CASCADE
);

-- =========================================================================
-- HÀM HỖ TRỢ (STORED PROCEDURES / FUNCTIONS)
-- =========================================================================

-- Hàm tăng số lượng đã bán (atomic, tránh bán vượt khi nhiều người mua cùng lúc)
CREATE OR REPLACE FUNCTION public.increment_so_luong_da_ban(
    p_ma_voucher TEXT,
    p_so_luong INT
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE public.voucher
    SET so_luong_da_ban = so_luong_da_ban + p_so_luong
    WHERE ma_voucher = p_ma_voucher
      AND so_luong_da_ban + p_so_luong <= so_luong_phat_hanh; -- Bảo đảm không bán vượt (RB-11)

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Voucher % đã hết số lượng hoặc không tồn tại.', p_ma_voucher;
    END IF;
END;
$$;