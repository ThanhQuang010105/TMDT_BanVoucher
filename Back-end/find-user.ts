import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  console.log('Searching for starbucks_vn@gmail.com in Auth Users...');
  // Loop through pages of users
  let page = 1;
  let found = false;
  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage: 100
    });
    if (error) {
      console.error('Error:', error);
      break;
    }
    const users = data.users || [];
    if (users.length === 0) break;
    const match = users.find(u => u.email?.toLowerCase() === 'starbucks_vn@gmail.com');
    if (match) {
      console.log('FOUND!', match);
      found = true;
      break;
    }
    page++;
  }
  if (!found) {
    console.log('Not found in Auth Users pages.');
  }
}

check();
