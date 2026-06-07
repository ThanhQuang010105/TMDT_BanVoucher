import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

const TABLES = [
  'chi_nhanh', 'nhat_ky_he_thong', 'tai_khoan', 'voucher_phat_hanh',
  'lich_su_giao_dich', 'don_hang', 'danh_gia', 'danh_muc',
  'doi_soat', 'phan_loai', 'khach_hang', 'voucher_chi_nhanh',
  'doi_tac', 'chi_tiet_gio_hang', 'chi_tiet_don_hang', 'dieu_kien_ap_dung',
  'khieu_nai', 'cay_danh_muc', 'voucher'
];

async function scan() {
  console.log('Scanning all tables for "starbucks_vn@gmail.com"...');
  for (const table of TABLES) {
    const { data, error } = await supabase.from(table).select('*');
    if (error) {
      console.error(`Error reading table ${table}:`, error);
      continue;
    }
    if (!data) continue;
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowStr = JSON.stringify(row).toLowerCase();
      if (rowStr.includes('starbucks_vn@gmail.com')) {
        console.log(`FOUND in table [${table}] at index ${i}:`, row);
      }
    }
  }
  console.log('Scan complete.');
}

scan();
