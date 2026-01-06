const { Client } = require('pg');

const sc = 'postgresql://postgres:kxfZoAyai_4FuHcfYVn8etSJf@db.lsjozpktmapfqxqyaarw.supabase.co:5432/postgres';

async function main() {
  const client = new Client({ connectionString: sc });
  try {
    await client.connect();
    console.log('CONNECTED');
    
    // Check constraints and unique indexes on sanction_history
    const res = await client.query(`
      SELECT 
        conname as constraint_name, 
        contype as constraint_type,
        pg_get_constraintdef(c.oid) as definition
      FROM pg_constraint c
      JOIN pg_namespace n ON n.oid = c.connamespace
      WHERE n.nspname = 'public' AND conrelid = 'public.sanction_history'::regclass;
    `);
    console.log('CONSTRAINTS:', JSON.stringify(res.rows, null, 2));

    const res2 = await client.query(`
      SELECT
          i.relname as index_name,
          a.attname as column_name,
          ix.indisunique as is_unique
      FROM
          pg_class t,
          pg_class i,
          pg_index ix,
          pg_attribute a
      WHERE
          t.oid = ix.indrelid
          AND i.oid = ix.indexrelid
          AND a.attrelid = t.oid
          AND a.attnum = ANY(ix.indkey)
          AND t.relkind = 'r'
          AND t.relname = 'sanction_history'
      ORDER BY
          t.relname,
          i.relname;
    `);
    console.log('INDEXES:', JSON.stringify(res2.rows, null, 2));

  } catch (err) {
    console.error('ERROR:', err.message);
  } finally {
    await client.end();
  }
}

main();
