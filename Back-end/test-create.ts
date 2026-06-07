import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const email = `test_error_${Date.now()}@gmail.com`;
  console.log(`Trying to create brand new user ${email}...`);
  const res = await supabase.auth.admin.createUser({
    email,
    password: '123456',
    email_confirm: true,
  });
  console.log('Result for new user:', JSON.stringify(res, null, 2));
}

test();
