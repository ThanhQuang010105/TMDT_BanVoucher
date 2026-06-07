import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data, error } = await supabase
    .from('tai_khoan')
    .select('*')
    .eq('username', 'starbucks_vn_test@gmail.com');
  console.log('Result in tai_khoan:', data, error);
}

test();
