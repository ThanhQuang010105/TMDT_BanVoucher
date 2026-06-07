import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_KEY!;

async function test() {
  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/`, {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`
      }
    });
    const data = await res.json() as any;
    console.log('Exposed Tables and Views:');
    const definitions = data.definitions || {};
    console.log(Object.keys(definitions));

    console.log('\nExposed RPC paths:');
    const paths = data.paths || {};
    const rpcPaths = Object.keys(paths).filter(p => p.startsWith('/rpc/'));
    console.log(rpcPaths);
  } catch (error: any) {
    console.error('Error fetching OpenAPI spec:', error.message);
  }
}

test();
