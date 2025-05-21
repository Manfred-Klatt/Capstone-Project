require('dotenv').config();
const { Pool } = require('pg');

// Create a connection pool to PostgreSQL
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'acnh_game',
  password: process.env.DB_PASSWORD || 'postgres',
  port: process.env.DB_PORT || 5432,
});

async function fixDatabase() {
  try {
    // Connect to the database
    const client = await pool.connect();
    console.log('Connected to PostgreSQL database');

    // Create high_scores table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS high_scores (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        category VARCHAR(50) NOT NULL,
        score INTEGER NOT NULL,
        date_achieved TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('High scores table created or already exists');

    // Create index on high_scores for faster lookups
    await client.query(`
      CREATE INDEX IF NOT EXISTS high_scores_user_category_idx ON high_scores (user_id, category);
    `);
    console.log('High scores index created or already exists');

    // Release the client back to the pool
    client.release();
    console.log('Database fix completed successfully');
  } catch (error) {
    console.error('Error fixing database:', error);
  } finally {
    // Close the pool
    await pool.end();
  }
}

// Run the fix function
fixDatabase();
