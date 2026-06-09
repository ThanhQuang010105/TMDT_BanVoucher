import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!);

async function test() {
  const email = `test_partner_${Date.now()}@gmail.com`;
  const password = 'password123';
  const ten_doanh_nghiep = 'Test Partner Corp';

  console.log('--- STEP 1: CREATE AUTH USER ---');
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { role: 'doi_tac' },
  });

  if (authError) {
    console.error('Auth Error:', authError);
    return;
  }
  const userId = authData.user?.id;
  console.log('User ID created:', userId);

  console.log('--- STEP 2: INSERT TAI_KHOAN ---');
  const { error: tkError } = await supabase.from('tai_khoan').insert({
    ma_tk: userId,
    username: email,
    vai_tro: 'doi_tac',
    trang_thai_hoat_dong: 'pending',
  });

  if (tkError) {
    console.error('Tai Khoan Error:', tkError);
    return;
  }
  console.log('Tai Khoan inserted.');

  console.log('--- STEP 3: INSERT DOI_TAC ---');
  const maDt = `DT-${uuidv4().slice(0, 8).toUpperCase()}`;
  const { error: dtError } = await supabase.from('doi_tac').insert({
    ma_dt: maDt,
    ma_tk: userId,
    ten_doanh_nghiep: ten_doanh_nghiep,
    nguoi_dai_dien: 'Test Representative',
    ma_so_thue: `MST-${Date.now().toString().slice(-8)}`,
    trang_thai_duyet: 'pending',
  });

  if (dtError) {
    console.error('Doi Tac Error:', dtError);
    return;
  }
  console.log('Doi Tac inserted successfully with ma_dt:', maDt);
}

test();
