import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  console.log('Listing all Auth Users containing key terms...');
  let page = 1;
  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage: 100
    });
    if (error) {
      console.error(error);
      break;
    }
    const users = data.users || [];
    if (users.length === 0) break;
    for (const u of users) {
      if (u.email?.includes('starbucks') || u.email?.includes('cgv') || u.email?.includes('highland') || u.email?.includes('admin')) {
        console.log(`Found in Auth: ID: ${u.id} | Email: ${u.email}`);
      }
    }
    page++;
  }
  console.log('Search complete.');
}

check();
