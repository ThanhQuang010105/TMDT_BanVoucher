import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!);

async function test() {
  // Query pg_trigger and pg_proc to find any user triggers or functions
  const { data, error } = await supabase.rpc('inspect_triggers' as any); // if rpc exists, otherwise query pg_trigger directly
  console.log('inspect_triggers:', data, error);

  // Let's run a raw query using sql, but wait, supabase-js does not have raw sql execution unless we call a function or query a system table
  // Let's try querying information_schema.triggers or pg_trigger through custom view or pg_catalog if allowed
  const { data: triggers, error: trErr } = await supabase.from('pg_trigger' as any).select('*');
  console.log('triggers:', triggers, trErr);
}
test();
