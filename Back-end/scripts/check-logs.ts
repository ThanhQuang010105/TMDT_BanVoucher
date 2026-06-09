import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!);

async function test() {
  const ids = ['1be06d5d-aa9d-4328-b1cd-3c9b82b2e701', 'b26d3000-7d5a-4391-bd9f-45a2bf9b10d6'];
  const { data: logs } = await supabase.from('nhat_ky_he_thong').select('*').in('ma_tk', ids);
  console.log('--- SYSTEM LOGS FOR RECENT PARTNERS ---');
  console.log(logs);
}
test();
