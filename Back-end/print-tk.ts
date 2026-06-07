import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  console.log('--- tai_khoan table ---');
  const { data: accounts } = await supabase.from('tai_khoan').select('*');
  console.table(accounts);
}

check();
