const { drizzle } = require('drizzle-orm/neon-serverless');
const { neon } = require('@neondatabase/serverless');
require('dotenv').config({ path: '.env.local' });

const sql = neon(process.env.DATABASE_URL);
const db = drizzle(sql);

async function testConnection() {
  try {
    console.log('Testing database connection...');
    console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'Not set');
    
    // Test basic query
    const result = await sql`SELECT 1 as test`;
    console.log('Connection test result:', result);
    
    // Test users table
    const users = await sql`SELECT * FROM users`;
    console.log('Users in database:', users);
    
    // Create test user if not exists
    const testUser = await sql`
      INSERT INTO users (id, email, name, created_at, updated_at) 
      VALUES ('test-user-123', 'test@example.com', 'Test User', NOW(), NOW())
      ON CONFLICT (id) DO NOTHING
      RETURNING *
    `;
    
    console.log('Test user created/updated:', testUser);
    
  } catch (error) {
    console.error('Database connection error:', error);
  }
}

testConnection(); 