import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const emails = ['admin@gmail.com', 'cgv_cinema@gmail.com', 'starbucks_vn@gmail.com', 'highlands_vn@gmail.com', 'khoado@gmail.com', 'thinhdao@gmail.com', 'minhanh@gmail.com'];
  for (const email of emails) {
    const { data: kh } = await supabase.from('khach_hang').select('*').eq('email', email);
    const { data: tk } = await supabase.from('tai_khoan').select('*').eq('username', email);
    console.log(`Email: ${email} | In khach_hang: ${kh?.length || 0} | In tai_khoan: ${tk?.length || 0}`);
  }
}

check();
