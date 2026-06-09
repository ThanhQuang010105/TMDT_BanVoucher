import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!);

async function test() {
  const { data: tk } = await supabase.from('tai_khoan').select('ma_tk, username, vai_tro, trang_thai_hoat_dong').order('ngay_tao', { ascending: false }).limit(10);
  console.log('--- RECENT TAI_KHOAN ---');
  console.log(tk);
}
test();
