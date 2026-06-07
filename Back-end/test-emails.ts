import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  console.log('Renaming starbucks_vn@gmail.com in tai_khoan permanently to temp...');
  await supabase
    .from('tai_khoan')
      .update({ username: 'starbucks_vn_old_temp@gmail.com' })
      .eq('ma_tk', '44444444-4444-4444-4444-444444444444');

  console.log('Trying to create starbucks_vn_test@gmail.com in Auth...');
  const res1 = await supabase.auth.admin.createUser({
    email: 'starbucks_vn_test@gmail.com',
    password: '123456',
    email_confirm: true,
  });
  console.log('Result for starbucks_vn_test@gmail.com:', res1.error ? res1.error.message : 'SUCCESS');

  console.log('Trying to create starbucks_vn@gmail.com in Auth...');
  const res2 = await supabase.auth.admin.createUser({
    email: 'starbucks_vn@gmail.com',
    password: '123456',
    email_confirm: true,
  });
  console.log('Result for starbucks_vn@gmail.com:', res2.error ? res2.error.message : 'SUCCESS');
}

test();
