import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log('Listing ALL auth users:');
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
      console.log(`- ID: ${u.id} | Email: ${u.email} | Confirmed: ${u.email_confirmed_at ? 'YES' : 'NO'} | Created: ${u.created_at}`);
    }
    page++;
  }
}

run();
