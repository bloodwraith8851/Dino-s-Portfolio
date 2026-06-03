import { neon } from '@neondatabase/serverless';

// Usage: NEON_DATABASE_URL=<your-neon-connection-string> node scripts/setup-neon.mjs

if (!process.env.NEON_DATABASE_URL) {
  console.error('❌ NEON_DATABASE_URL environment variable is required.');
  console.error('   Usage: NEON_DATABASE_URL=<url> node scripts/setup-neon.mjs');
  process.exit(1);
}

async function setupSchema() {
  const sql = neon(process.env.NEON_DATABASE_URL);

  console.log('Creating Neon DB schema...');

  await sql`
    CREATE TABLE IF NOT EXISTS page_views (
      id SERIAL PRIMARY KEY,
      view_date DATE NOT NULL,
      count INT NOT NULL DEFAULT 1,
      UNIQUE(view_date)
    )
  `;
  console.log('✓ page_views table created');

  await sql`
    CREATE TABLE IF NOT EXISTS analytics_events (
      id SERIAL PRIMARY KEY,
      event_type TEXT NOT NULL,
      metadata JSONB DEFAULT '{}',
      visitor_alias TEXT DEFAULT 'anonymous',
      created_at TIMESTAMPTZ DEFAULT now()
    )
  `;
  console.log('✓ analytics_events table created');

  await sql`
    CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at
    ON analytics_events(created_at DESC)
  `;
  console.log('✓ Index created on analytics_events.created_at');

  await sql`
    CREATE INDEX IF NOT EXISTS idx_page_views_date
    ON page_views(view_date DESC)
  `;
  console.log('✓ Index created on page_views.view_date');

  console.log('\n✅ Neon DB schema setup complete!');
}

setupSchema().catch(err => {
  console.error('❌ Schema setup failed:', err.message);
  process.exit(1);
});
