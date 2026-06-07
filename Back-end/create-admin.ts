import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function createAdmin() {
  const email = 'admin_new@gmail.com';
  const password = '123456';
  
  console.log(`Creating admin account: ${email}...`);
  
  const { data: createData, error: createError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { role: 'admin' }
  });

  if (createError) {
    console.error('Error creating user in Supabase Auth:', createError.message);
    return;
  }

  const user = createData.user;
  console.log(`User created in Supabase Auth! ID: ${user.id}`);

  // Insert into tai_khoan table
  const { error: dbError } = await supabase.from('tai_khoan').insert({
    ma_tk: user.id,
    username: email,
    vai_tro: 'admin',
    trang_thai_hoat_dong: 'active'
  });

  if (dbError) {
    console.error('Error inserting into public.tai_khoan:', dbError.message);
  } else {
    console.log(`Successfully created admin account:`);
    console.log(`Email: ${email}`);
    console.log(`Mật khẩu: ${password}`);
  }
}

createAdmin();
