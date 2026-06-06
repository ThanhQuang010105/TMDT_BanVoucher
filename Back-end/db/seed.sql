-- Script nạp dữ liệu mẫu (Seeding) cho dự án DA_TMDT_BAN_VOUCHER
-- Chạy script này trong SQL Editor của Supabase sau khi đã chạy schema.sql

-- 1. NẠP DỮ LIỆU TÀI KHOẢN VÀ ĐỐI TÁC MẪU
-- Tạo tài khoản Auth giả lập cho CGV
INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, role, aud, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at)
VALUES (
    '00000000-0000-0000-0000-000000000001', 
    '00000000-0000-0000-0000-000000000000', 
    'partner@cgv.vn', 
    '$2a$10$abcdefghijklmnopqrstuv', 
    now(), 
    'authenticated', 
    'authenticated', 
    '{"provider":"email","providers":["email"]}', 
    '{"role":"doi_tac"}', 
    false, 
    now(), 
    now()
) ON CONFLICT (id) DO NOTHING;

-- Tạo tài khoản Auth giả lập cho Starbucks
INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, role, aud, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at)
VALUES (
    '00000000-0000-0000-0000-000000000002', 
    '00000000-0000-0000-0000-000000000000', 
    'partner@starbucks.vn', 
    '$2a$10$abcdefghijklmnopqrstuv', 
    now(), 
    'authenticated', 
    'authenticated', 
    '{"provider":"email","providers":["email"]}', 
    '{"role":"doi_tac"}', 
    false, 
    now(), 
    now()
) ON CONFLICT (id) DO NOTHING;

-- Tạo tai_khoan tương ứng trong database
INSERT INTO public.tai_khoan (ma_tk, username, vai_tro, trang_thai_hoat_dong)
VALUES 
('00000000-0000-0000-0000-000000000001', 'partner_cgv', 'doi_tac', 'active'),
('00000000-0000-0000-0000-000000000002', 'partner_starbucks', 'doi_tac', 'active')
ON CONFLICT (ma_tk) DO NOTHING;

-- Tạo Đối Tác
INSERT INTO public.doi_tac (ma_dt, ma_tk, ten_doanh_nghiep, nguoi_dai_dien, ma_so_thue, trang_thai_duyet)
VALUES 
('DT_CGV', '00000000-0000-0000-0000-000000000001', 'CGV Cinemas Việt Nam', 'Nguyễn Văn A', '0102030405', 'da_duyet'),
('DT_STARBUCKS', '00000000-0000-0000-0000-000000000002', 'Starbucks Vietnam', 'Trần Thị B', '0102030406', 'da_duyet')
ON CONFLICT (ma_dt) DO NOTHING;

-- Tạo Chi Nhánh
INSERT INTO public.chi_nhanh (ma_cn, ma_dt, ten_chi_nhanh, dia_chi, trang_thai_hoat_dong)
VALUES 
('CN_CGV_HUNGVUONG', 'DT_CGV', 'CGV Hùng Vương Plaza', 'Tầng 7, Hùng Vương Plaza, Q.5, TP.HCM', 'active'),
('CN_CGV_SCVIVO', 'DT_CGV', 'CGV SC VivoCity', 'Tầng 5, SC VivoCity, Q.7, TP.HCM', 'active'),
('CN_SB_DONGKHOI', 'DT_STARBUCKS', 'Starbucks Đồng Khởi', '38 Đông Khởi, Q.1, TP.HCM', 'active')
ON CONFLICT (ma_cn) DO NOTHING;


-- 2. NẠP PHÂN LOẠI & DANH MỤC VOUCHER
-- Tạo Cây Danh Mục
INSERT INTO public.cay_danh_muc (ma_taxonomy, ten_taxonomy, cap_do)
VALUES 
('TAX_DICH_VU', 'Danh mục Dịch vụ', 1)
ON CONFLICT (ma_taxonomy) DO NOTHING;

-- Tạo Danh Mục con (Taxons)
INSERT INTO public.danh_muc (ma_taxon, ten_taxon, ma_taxonomy)
VALUES 
('CAT_XEM_PHIM', 'Vé xem phim', 'TAX_DICH_VU'),
('CAT_CAFE', 'Cà phê & Đồ uống', 'TAX_DICH_VU')
ON CONFLICT (ma_taxon) DO NOTHING;

-- Tạo Phân Loại Voucher
INSERT INTO public.phan_loai (ma_pl, ten_loai_voucher)
VALUES 
('PL_PHAN_TRAM', 'Giảm phần trăm'),
('PL_TIEN_MAT', 'Giảm tiền mặt')
ON CONFLICT (ma_pl) DO NOTHING;


-- 3. NẠP VOUCHER MẪU
INSERT INTO public.voucher (ma_voucher, ma_dt, ten_voucher, mo_ta, gia_goc, gia_ban, so_luong_phat_hanh, so_luong_da_ban, ma_pl, ma_taxon, ngay_bd, ngay_kt, trang_thai)
VALUES 
(
    'VOUCHER_CGV_01', 
    'DT_CGV', 
    'Vé xem phim CGV 2D Cuối Tuần', 
    'Áp dụng cho mọi cụm rạp CGV toàn quốc vào tất cả các ngày trong tuần kể cả thứ 7 và Chủ nhật.', 
    120000, 
    85000, 
    500, 
    0, 
    'PL_TIEN_MAT', 
    'CAT_XEM_PHIM', 
    '2026-01-01 00:00:00+00', 
    '2026-12-31 23:59:59+00', 
    'active'
),
(
    'VOUCHER_SB_01', 
    'DT_STARBUCKS', 
    'Voucher Starbucks Mua 1 Tặng 1', 
    'Áp dụng cho dòng nước Frappuccino cỡ vừa (Size M). Không áp dụng chung với khuyến mãi khác.', 
    100000, 
    95000, 
    200, 
    0, 
    'PL_PHAN_TRAM', 
    'CAT_CAFE', 
    '2026-01-01 00:00:00+00', 
    '2026-12-31 23:59:59+00', 
    'active'
)
ON CONFLICT (ma_voucher) DO NOTHING;


-- 4. KẾT NỐI CHI NHÁNH CHO VOUCHER
INSERT INTO public.voucher_chi_nhanh (ma_voucher, ma_cn)
VALUES 
('VOUCHER_CGV_01', 'CN_CGV_HUNGVUONG'),
('VOUCHER_CGV_01', 'CN_CGV_SCVIVO'),
('VOUCHER_SB_01', 'CN_SB_DONGKHOI')
ON CONFLICT (ma_voucher, ma_cn) DO NOTHING;
