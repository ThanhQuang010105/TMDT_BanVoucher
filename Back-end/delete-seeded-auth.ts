import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

const IDS = [
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  '33333333-3333-3333-3333-333333333333',
  '44444444-4444-4444-4444-444444444444',
  '66666666-6666-6666-6666-666666666666',
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222',
  '55555555-5555-5555-5555-555555555555'
];

async function run() {
  console.log('Attempting to delete old seeded user IDs from Auth...');
  for (const id of IDS) {
    const { data, error } = await supabase.auth.admin.deleteUser(id);
    if (error) {
      console.log(`ID: ${id} -> Error: ${error.message}`);
    } else {
      console.log(`ID: ${id} -> DELETED successfully or was not there.`);
    }
  }
}

run();
