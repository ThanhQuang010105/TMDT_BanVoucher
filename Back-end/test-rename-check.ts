import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  console.log('Renaming...');
  const res = await supabase
    .from('tai_khoan')
    .update({ username: 'starbucks_vn_old_temp@gmail.com' })
    .eq('ma_tk', '44444444-4444-4444-4444-444444444444')
    .select();
  console.log('Rename result:', JSON.stringify(res, null, 2));

  console.log('Querying tai_khoan for starbucks...');
  const res2 = await supabase
    .from('tai_khoan')
    .select('*')
    .eq('ma_tk', '44444444-4444-4444-4444-444444444444');
  console.log('Current row:', res2.data);
}

test();
