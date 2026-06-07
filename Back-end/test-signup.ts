import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const email = 'starbucks_vn@gmail.com';
  console.log(`Trying to sign up ${email} via auth.signUp...`);
  const res = await supabase.auth.signUp({
    email,
    password: '123456',
  });
  console.log('Result:', JSON.stringify(res, null, 2));
}

test();
