import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../../supabase/supabase.service';
import { SearchVoucherDto } from './dto/search-voucher.dto';
import { CreateVoucherDto } from './dto/create-voucher.dto';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';
import { VoucherStatus } from './enums/voucher-status.enum';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class VouchersService {
  constructor(private readonly supabaseService: SupabaseService) {}

  // ─── TRANG CHỦ: DANH SÁCH DANH MỤC + BANNER ─────────────────────────────────
  async getHomepageData() {
    const client = this.supabaseService.getClient();

    // Lấy danh sách danh mục cấp 1 (không có cha)
    const { data: categories } = await client
      .from('danh_muc')
      .select('ma_taxon, ten_taxon, ma_taxonomy')
      .is('ma_taxon_cha', null)
      .order('thu_tu_hien_thi');

    // Lấy voucher nổi bật (trạng thái 'active', còn hàng, sắp xếp mới nhất)
    const now = new Date().toISOString();
    const { data: featuredVouchers } = await client
      .from('voucher')
      .select(`
        ma_voucher, ten_voucher, mo_ta, gia_goc, gia_ban,
        so_luong_phat_hanh, so_luong_da_ban, ngay_bd, ngay_kt, link_voucher_banner,
        doi_tac ( ten_doanh_nghiep )
      `)
      .eq('trang_thai', 'active')
      .gte('ngay_kt', now)
      .lte('ngay_bd', now)
      .order('ngay_bd', { ascending: false })
      .limit(12);

    return {
      categories: categories ?? [],
      featured_vouchers: featuredVouchers ?? [],
    };
  }

  // ─── TÌM KIẾM VÀ LỌC VOUCHER (DÀNH CHO KHÁCH HÀNG) ──────────────────────────
  async searchVouchers(dto: SearchVoucherDto) {
    const client = this.supabaseService.getClient();
    const page = parseInt(dto.page ?? '1', 10);
    const limit = parseInt(dto.limit ?? '12', 10);
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    const now = new Date().toISOString();

    let query = client
      .from('voucher')
      .select(
        `ma_voucher, ten_voucher, mo_ta, gia_goc, gia_ban,
         so_luong_phat_hanh, so_luong_da_ban, ngay_bd, ngay_kt, link_voucher_banner,
         doi_tac ( ma_dt, ten_doanh_nghiep ),
         danh_muc ( ma_taxon, ten_taxon )`,
        { count: 'exact' },
      );

    // Lọc theo trạng thái hiệu lực (sap_dien_ra, dang_dien_ra, het_han)
    if (dto.hieu_luc) {
      if (dto.hieu_luc === 'dang_dien_ra') {
        query = query
          .eq('trang_thai', 'active')
          .gte('ngay_kt', now)
          .lte('ngay_bd', now);
      } else if (dto.hieu_luc === 'sap_dien_ra') {
        query = query
          .in('trang_thai', ['active', 'scheduled'])
          .gt('ngay_bd', now);
      } else if (dto.hieu_luc === 'het_han') {
        query = query.lt('ngay_kt', now);
      }
    } else {
      // Mặc định: Chỉ lấy voucher đang hoạt động trong hạn
      query = query
        .eq('trang_thai', 'active')
        .gte('ngay_kt', now)
        .lte('ngay_bd', now);
    }

    query = query.gt('so_luong_phat_hanh', 0); // Còn hàng

    // Lọc theo từ khóa (tên voucher)
    if (dto.keyword) {
      query = query.ilike('ten_voucher', `%${dto.keyword}%`);
    }

    // Lọc theo danh mục
    if (dto.ma_taxon) {
      query = query.eq('ma_taxon', dto.ma_taxon);
    }

    // Lọc theo đối tác
    if (dto.ma_dt) {
      query = query.eq('ma_dt', dto.ma_dt);
    }

    // Lọc theo khoảng giá bán
    if (dto.gia_min) {
      query = query.gte('gia_ban', parseFloat(dto.gia_min));
    }
    if (dto.gia_max) {
      query = query.lte('gia_ban', parseFloat(dto.gia_max));
    }

    const { data, count, error } = await query.range(from, to);

    if (error) throw new NotFoundException(error.message);

    return {
      data: data ?? [],
      pagination: {
        total: count ?? 0,
        page,
        limit,
        total_pages: Math.ceil((count ?? 0) / limit),
      },
    };
  }

  // ─── CHI TIẾT VOUCHER ────────────────────────────────────────────────────────
  async getVoucherDetail(maVoucher: string) {
    const client = this.supabaseService.getClient();

    // Thông tin chính của voucher
    const { data: voucher, error } = await client
      .from('voucher')
      .select(`
        ma_voucher, ten_voucher, mo_ta, gia_goc, gia_ban,
        so_luong_phat_hanh, so_luong_da_ban, ngay_bd, ngay_kt, trang_thai, link_voucher_banner,
        doi_tac ( ma_dt, ten_doanh_nghiep, nguoi_dai_dien ),
        danh_muc ( ma_taxon, ten_taxon ),
        phan_loai ( ma_pl, ten_loai_voucher )
      `)
      .eq('ma_voucher', maVoucher)
      .single();

    if (error || !voucher) throw new NotFoundException('Không tìm thấy voucher.');

    // Danh sách chi nhánh áp dụng (từ bảng chi_nhanh qua đối tác)
    const { data: chiNhanh } = await client
      .from('chi_nhanh')
      .select('ma_cn, ten_chi_nhanh, dia_chi')
      .eq('ma_dt', (voucher as any).doi_tac?.ma_dt ?? '')
      .eq('trang_thai_hoat_dong', 'active');

    // Lấy đánh giá và điểm trung bình
    const { data: reviews } = await client
      .from('danh_gia')
      .select(`
        ma_dg, diem_so_dg, noi_dung_binh_luan, ngay_danh_gia,
        khach_hang ( ho_ten )
      `)
      .eq('ma_voucher', maVoucher)
      .order('ngay_danh_gia', { ascending: false })
      .limit(10);

    // Tính điểm trung bình
    const avgRating =
      reviews && reviews.length > 0
        ? (reviews.reduce((sum, r) => sum + (r.diem_so_dg ?? 0), 0) / reviews.length).toFixed(1)
        : null;

    // Số lượng còn lại
    const conLai =
      (voucher as any).so_luong_phat_hanh - (voucher as any).so_luong_da_ban;

    return {
      data: {
        ...voucher,
        ton_kho: conLai,
        chi_nhanh: chiNhanh ?? [],
        danh_gia: reviews ?? [],
        diem_trung_binh: avgRating,
        so_luong_danh_gia: reviews?.length ?? 0,
      },
    };
  }

  // ─── DANH MỤC CÂY ────────────────────────────────────────────────────────────
  async getCategories() {
    const client = this.supabaseService.getClient();

    // Lấy toàn bộ danh mục, frontend sẽ tự xây cây phân cấp
    const { data, error } = await client
      .from('danh_muc')
      .select('ma_taxon, ten_taxon, ma_taxon_cha, ma_taxonomy, thu_tu_hien_thi')
      .order('thu_tu_hien_thi');

    if (error) throw new NotFoundException(error.message);

    return { data: data ?? [] };
  }

  // ─── DANH SÁCH PHÂN LOẠI VOUCHER ─────────────────────────────────────────────
  async getPhanLoai() {
    const client = this.supabaseService.getClient();
    const { data, error } = await client
      .from('phan_loai')
      .select('ma_pl, ten_loai_voucher, trang_thai, mo_ta')
      .eq('trang_thai', 'active')
      .order('ten_loai_voucher');

    if (error) {
      // Nếu không có cột trang_thai, lấy tất cả
      const { data: all } = await client
        .from('phan_loai')
        .select('ma_pl, ten_loai_voucher, mo_ta');
      return { data: all ?? [] };
    }

    return { data: data ?? [] };
  }

  // ─── TÍNH NĂNG MỚI TÍCH HỢP TỪ KIÊN (DÀNH CHO ĐỐI TÁC / QUẢN TRỊ) ─────────────

  // Tạo voucher nháp (DRAFT)
  async createVoucher(dto: CreateVoucherDto, userId?: string) {
    if (dto.GiaBan > dto.GiaGoc) {
      throw new BadRequestException('Giá bán phải nhỏ hơn hoặc bằng giá gốc');
    }
    if (new Date(dto.NgayBD) >= new Date(dto.NgayKT)) {
      throw new BadRequestException('Ngày bắt đầu phải trước ngày kết thúc');
    }
    if (new Date(dto.NgayKT) <= new Date()) {
      throw new BadRequestException('Ngày kết thúc phải lớn hơn thời điểm hiện tại');
    }

    const client = this.supabaseService.getClient();
    let partnerId = dto.MaDT;

    if (userId) {
      const { data: doiTac } = await client
        .from('doi_tac')
        .select('ma_dt')
        .eq('ma_tk', userId)
        .single();
      if (doiTac) {
        partnerId = doiTac.ma_dt;
      }
    }

    if (!partnerId) {
      throw new BadRequestException('Không xác định được đối tác tạo voucher. Vui lòng kiểm tra lại tài khoản.');
    }

    const maVoucher = `VC-${uuidv4().slice(0, 8).toUpperCase()}`;

    const voucherData = {
      ma_voucher: maVoucher,
      ma_dt: partnerId,
      ma_pl: dto.MaPL,
      ma_taxon: dto.MaTaxon,
      ten_voucher: dto.TenVoucher,
      mo_ta: dto.MoTa,
      gia_goc: dto.GiaGoc,
      gia_ban: dto.GiaBan,
      so_luong_phat_hanh: dto.SoLuongPhatHanh,
      so_luong_da_ban: 0,
      ngay_bd: dto.NgayBD,
      ngay_kt: dto.NgayKT,
      link_voucher_banner: dto.bannerUrl, // Ánh xạ đúng tên trường link_voucher_banner
      trang_thai: VoucherStatus.DRAFT,
    };

    const { data, error } = await this.supabaseService
      .getClient()
      .from('voucher')
      .insert(voucherData)
      .select()
      .single();

    if (error) {
      throw new BadRequestException(error.message);
    }

    if (userId) {
      await this.supabaseService.writeLog(userId, `Tạo mới voucher nháp: ${dto.TenVoucher} (${maVoucher})`);
    }

    return {
      success: true,
      data,
      message: 'Tạo voucher nháp thành công',
    };
  }

  // Lấy toàn bộ voucher (kể cả nháp, chờ duyệt...)
  async getAllVouchers(userId?: string) {
    const client = this.supabaseService.getClient();
    let query = client.from('voucher').select('*');

    if (userId) {
      const { data: taiKhoan } = await client
        .from('tai_khoan')
        .select('vai_tro')
        .eq('ma_tk', userId)
        .single();

      if (taiKhoan?.vai_tro === 'doi_tac') {
        const { data: doiTac } = await client
          .from('doi_tac')
          .select('ma_dt')
          .eq('ma_tk', userId)
          .single();

        if (doiTac) {
          query = query.eq('ma_dt', doiTac.ma_dt);
        } else {
          return {
            success: true,
            data: [],
          };
        }
      }
    }

    const { data, error } = await query;

    if (error) {
      throw new BadRequestException(error.message);
    }

    return {
      success: true,
      data: data ?? [],
    };
  }

  async getPartnerProfile(userId: string) {
    const client = this.supabaseService.getClient();
    const { data: partner, error } = await client
      .from('doi_tac')
      .select('*, tai_khoan(trang_thai_hoat_dong)')
      .eq('ma_tk', userId)
      .single();

    if (error || !partner) {
      throw new NotFoundException('Không tìm thấy thông tin đối tác');
    }

    return {
      success: true,
      data: {
        ma_dt: partner.ma_dt,
        ten_doanh_nghiep: partner.ten_doanh_nghiep,
        nguoi_dai_dien: partner.nguoi_dai_dien,
        ma_so_thue: partner.ma_so_thue,
        trang_thai_duyet: partner.trang_thai_duyet,
        trang_thai_hoat_dong: (partner as any).tai_khoan?.trang_thai_hoat_dong,
      },
    };
  }

  // Bóc tách đường dẫn từ URL để xóa file trên Storage
  private extractPathFromUrl(url: string): string | null {
    try {
      const parts = url.split('/storage/v1/object/public/images/');
      return parts[1] || null;
    } catch {
      return null;
    }
  }

  // Cập nhật voucher và xóa banner cũ trên Storage nếu đổi banner
  async updateVoucher(id: string, payload: any, userId?: string) {
    const client = this.supabaseService.getClient();

    const { data: voucher, error: findError } = await client
      .from('voucher')
      .select('*')
      .eq('ma_voucher', id)
      .single();

    if (findError || !voucher) {
      throw new NotFoundException('Voucher không tồn tại');
    }

    // Nếu thay đổi đường dẫn banner, tiến hành xóa ảnh banner cũ trên Supabase Storage
    if (payload.link_voucher_banner && payload.link_voucher_banner !== voucher.link_voucher_banner) {
      const oldPath = this.extractPathFromUrl(voucher.link_voucher_banner);
      if (oldPath) {
        await client.storage.from('images').remove([oldPath]);
      }
    }

    // Kiểm tra trạng thái để cập nhật về PENDING nếu bị từ chối/lên lịch trước đó
    if (
      voucher.trang_thai === VoucherStatus.REJECTED ||
      voucher.trang_thai === VoucherStatus.SCHEDULED
    ) {
      payload.trang_thai = VoucherStatus.PENDING;
    }

    if (voucher.trang_thai === VoucherStatus.DRAFT) {
      payload.trang_thai = VoucherStatus.DRAFT;
    }

    const { data, error } = await client
      .from('voucher')
      .update(payload)
      .eq('ma_voucher', id)
      .select()
      .single();

    if (error) {
      throw new BadRequestException(error.message);
    }

    if (userId) {
      await this.supabaseService.writeLog(userId, `Cập nhật thông tin voucher: ${id}`);
    }

    return {
      success: true,
      data,
      message: 'Cập nhật thông tin voucher thành công',
    };
  }

  // Xóa voucher và dọn dẹp file banner trên Storage
  async removeVoucher(id: string, userId?: string) {
    const client = this.supabaseService.getClient();

    const { data: voucher } = await client
      .from('voucher')
      .select('*')
      .eq('ma_voucher', id)
      .single();

    if (voucher?.link_voucher_banner) {
      const oldPath = this.extractPathFromUrl(voucher.link_voucher_banner);
      if (oldPath) {
        await client.storage.from('images').remove([oldPath]);
      }
    }

    const { error } = await client
      .from('voucher')
      .delete()
      .eq('ma_voucher', id);

    if (error) {
      throw new BadRequestException(error.message);
    }

    if (userId) {
      await this.supabaseService.writeLog(userId, `Xóa voucher: ${id}`);
    }

    return {
      success: true,
      message: 'Xóa voucher thành công',
    };
  }

  // Gửi duyệt voucher
  async submitVoucher(id: string, userId?: string) {
    const { data: voucher, error: findError } = await this.supabaseService
      .getClient()
      .from('voucher')
      .select('*')
      .eq('ma_voucher', id)
      .single();

    if (findError || !voucher) {
      throw new NotFoundException('Voucher không tồn tại');
    }

    if (voucher.trang_thai !== VoucherStatus.DRAFT) {
      throw new BadRequestException('Voucher không còn ở trạng thái nháp để gửi duyệt');
    }

    const { data, error } = await this.supabaseService
      .getClient()
      .from('voucher')
      .update({
        trang_thai: VoucherStatus.PENDING,
      })
      .eq('ma_voucher', id)
      .select()
      .single();

    if (error) {
      throw new BadRequestException(error.message);
    }

    if (userId) {
      await this.supabaseService.writeLog(userId, `Gửi duyệt voucher: ${id}`);
    }

    return {
      success: true,
      data,
      message: 'Gửi duyệt voucher thành công',
    };
  }

  // Tìm kiếm voucher nâng cao cho Admin / Đối tác
  async searchVoucherForAdmin(query: any, userId?: string) {
    const client = this.supabaseService.getClient();
    let request = client.from('voucher').select('*');

    if (userId) {
      const { data: taiKhoan } = await client
        .from('tai_khoan')
        .select('vai_tro')
        .eq('ma_tk', userId)
        .single();

      if (taiKhoan?.vai_tro === 'doi_tac') {
        const { data: doiTac } = await client
          .from('doi_tac')
          .select('ma_dt')
          .eq('ma_tk', userId)
          .single();

        if (doiTac) {
          request = request.eq('ma_dt', doiTac.ma_dt);
        } else {
          return {
            success: true,
            total: 0,
            data: [],
          };
        }
      }
    }

    if (query.TenVoucher) {
      request = request.ilike('ten_voucher', `%${query.TenVoucher}%`);
    }

    if (query.TrangThai) {
      request = request.eq('trang_thai', query.TrangThai.toLowerCase());
    }

    if (query.GiaMin) {
      request = request.gte('gia_ban', query.GiaMin);
    }

    if (query.GiaMax) {
      request = request.lte('gia_ban', query.GiaMax);
    }

    const { data, error } = await request;

    if (error) {
      throw new BadRequestException(error.message);
    }

    let results = data ?? [];

    if (query.TiLeGiamMin) {
      results = results.filter(
        (v) => ((v.gia_goc - v.gia_ban) / v.gia_goc) * 100 >= query.TiLeGiamMin,
      );
    }

    return {
      success: true,
      total: results.length,
      data: results,
    };
  }

  // Duyệt voucher và tự động lên lịch/hoạt động
  async approveVoucher(id: string, userId?: string) {
    const { data: voucher, error: findError } = await this.supabaseService
      .getClient()
      .from('voucher')
      .select('*')
      .eq('ma_voucher', id)
      .single();

    if (findError || !voucher) {
      throw new NotFoundException('Voucher không tồn tại');
    }

    if (voucher.trang_thai !== VoucherStatus.PENDING) {
      throw new BadRequestException('Voucher không ở trạng thái chờ duyệt');
    }

    // Validate theo BRD (RB-02, RB-03) khi duyệt voucher
    if (Number(voucher.gia_ban) > Number(voucher.gia_goc)) {
      throw new BadRequestException('Giá bán không được lớn hơn giá gốc');
    }
    const ngayBd = new Date(voucher.ngay_bd);
    const ngayKt = new Date(voucher.ngay_kt);
    if (ngayBd >= ngayKt) {
      throw new BadRequestException('Ngày bắt đầu phải trước ngày kết thúc');
    }
    if (ngayKt <= new Date()) {
      throw new BadRequestException('Ngày kết thúc phải lớn hơn thời điểm hiện tại');
    }

    const now = new Date();
    const status =
      new Date(voucher.ngay_bd) > now
        ? VoucherStatus.SCHEDULED
        : VoucherStatus.ACTIVE;

    const { data, error } = await this.supabaseService
      .getClient()
      .from('voucher')
      .update({
        trang_thai: status,
      })
      .eq('ma_voucher', id)
      .select()
      .single();

    if (error) {
      throw new BadRequestException(error.message);
    }

    if (userId) {
      await this.supabaseService.writeLog(userId, `Phê duyệt voucher: ${id}`);
    }

    return {
      success: true,
      data,
      message: 'Duyệt voucher thành công',
    };
  }

  // Từ chối duyệt voucher
  async rejectVoucher(id: string, userId?: string) {
    const { data: voucher, error: findError } = await this.supabaseService
      .getClient()
      .from('voucher')
      .select('*')
      .eq('ma_voucher', id)
      .single();

    if (findError || !voucher) {
      throw new NotFoundException('Voucher không tồn tại');
    }

    if (voucher.trang_thai !== VoucherStatus.PENDING) {
      throw new BadRequestException('Voucher không ở trạng thái chờ duyệt');
    }

    const { data, error } = await this.supabaseService
      .getClient()
      .from('voucher')
      .update({
        trang_thai: VoucherStatus.REJECTED,
      })
      .eq('ma_voucher', id)
      .select()
      .single();

    if (error) {
      throw new BadRequestException(error.message);
    }

    if (userId) {
      await this.supabaseService.writeLog(userId, `Từ chối duyệt voucher: ${id}`);
    }

    return {
      success: true,
      data,
      message: 'Từ chối duyệt voucher thành công',
    };
  }

  // Lấy chi nhánh của đối tác
  async getBranches(maDT: string) {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('chi_nhanh')
      .select('*')
      .eq('ma_dt', maDT);

    if (error) {
      throw new BadRequestException(error.message);
    }

    return {
      success: true,
      data,
    };
  }

  // Tải banner lên Supabase Storage
  async uploadBanner(file: any) {
    const fileName = `banner-url/${Date.now()}-${file.originalname}`;

    const { error } = await this.supabaseService
      .getClient()
      .storage.from('images')
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
      });

    if (error) {
      throw new BadRequestException(error.message);
    }

    const {
      data: { publicUrl },
    } = this.supabaseService
      .getClient()
      .storage.from('images')
      .getPublicUrl(fileName);

    return {
      success: true,
      data: {
        bannerUrl: publicUrl,
      },
      message: 'Upload banner thành công',
    };
  }

  // ─── CRUD CHI NHÁNH (BR-PAR-01) ──────────────────────────────────────────────

  // Thêm chi nhánh mới
  async createBranch(dto: CreateBranchDto) {
    const client = this.supabaseService.getClient();

    // Kiểm tra xem đối tác có tồn tại không
    const { data: doiTac, error: dtError } = await client
      .from('doi_tac')
      .select('ma_dt')
      .eq('ma_dt', dto.ma_dt)
      .single();

    if (dtError || !doiTac) {
      throw new NotFoundException('Đối tác không tồn tại');
    }

    const maCN = `CN-${uuidv4().slice(0, 8).toUpperCase()}`;

    const { data, error } = await client
      .from('chi_nhanh')
      .insert({
        ma_cn: maCN,
        ma_dt: dto.ma_dt,
        ten_chi_nhanh: dto.ten_chi_nhanh,
        dia_chi: dto.dia_chi ?? null,
        trang_thai_hoat_dong: dto.trang_thai_hoat_dong ?? 'active',
      })
      .select()
      .single();

    if (error) {
      throw new BadRequestException(error.message);
    }

    return {
      success: true,
      data,
      message: 'Thêm chi nhánh thành công',
    };
  }

  // Cập nhật thông tin chi nhánh
  async updateBranch(maCN: string, dto: UpdateBranchDto) {
    const client = this.supabaseService.getClient();

    // Kiểm tra chi nhánh tồn tại
    const { data: chiNhanh, error: cnError } = await client
      .from('chi_nhanh')
      .select('*')
      .eq('ma_cn', maCN)
      .single();

    if (cnError || !chiNhanh) {
      throw new NotFoundException('Chi nhánh không tồn tại');
    }

    const { data, error } = await client
      .from('chi_nhanh')
      .update({
        ten_chi_nhanh: dto.ten_chi_nhanh ?? chiNhanh.ten_chi_nhanh,
        dia_chi: dto.dia_chi ?? chiNhanh.dia_chi,
        trang_thai_hoat_dong: dto.trang_thai_hoat_dong ?? chiNhanh.trang_thai_hoat_dong,
      })
      .eq('ma_cn', maCN)
      .select()
      .single();

    if (error) {
      throw new BadRequestException(error.message);
    }

    return {
      success: true,
      data,
      message: 'Cập nhật thông tin chi nhánh thành công',
    };
  }

  // Xóa chi nhánh
  async deleteBranch(maCN: string) {
    const client = this.supabaseService.getClient();

    // Kiểm tra chi nhánh tồn tại
    const { data: chiNhanh, error: cnError } = await client
      .from('chi_nhanh')
      .select('ma_cn')
      .eq('ma_cn', maCN)
      .single();

    if (cnError || !chiNhanh) {
      throw new NotFoundException('Chi nhánh không tồn tại');
    }

    const { error } = await client
      .from('chi_nhanh')
      .delete()
      .eq('ma_cn', maCN);

    if (error) {
      throw new BadRequestException(error.message);
    }

    return {
      success: true,
      message: 'Xóa chi nhánh thành công',
    };
  }
}
