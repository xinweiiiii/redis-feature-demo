import { Pool } from 'pg';

// PostgreSQL connection configuration
const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'rdi-rds-pg-xw-y5vdps.cd8u51tyxbit.ap-southeast-1.rds.amazonaws.com',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: process.env.POSTGRES_DB || 'rdi_tag_team_demo',
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  ssl: {
    rejectUnauthorized: false // Required for AWS RDS and most cloud PostgreSQL instances
  }
});

// Test the connection
pool.on('connect', () => {
  console.log('Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client', err);
  process.exit(-1);
});

// Customer interface
export interface Customer {
  id: number;
  name: string;
  email: string;
  country: string | null;
  created_at: Date;
}

// Helper functions for customer operations
export const customerHelpers = {
  // Insert a new customer
  insertCustomer: async (name: string, email: string, country: string | null): Promise<Customer> => {
    const query = `
      INSERT INTO demo.customers (name, email, country, created_at)
      VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
      RETURNING id, name, email, country, created_at
    `;
    const result = await pool.query(query, [name, email, country]);
    return result.rows[0];
  },

  // Get all customers
  getAllCustomers: async (): Promise<Customer[]> => {
    const query = 'SELECT id, name, email, country, created_at FROM demo.customers ORDER BY created_at DESC';
    const result = await pool.query(query);
    return result.rows;
  },

  // Get customer by ID
  getCustomerById: async (id: number): Promise<Customer | null> => {
    const query = 'SELECT id, name, email, country, created_at FROM demo.customers WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  },

  // Get customer by email
  getCustomerByEmail: async (email: string): Promise<Customer | null> => {
    const query = 'SELECT id, name, email, country, created_at FROM demo.customers WHERE email = $1';
    const result = await pool.query(query, [email]);
    return result.rows[0] || null;
  },

  // Delete all customers (for demo reset)
  deleteAllCustomers: async (): Promise<void> => {
    await pool.query('DELETE FROM demo.customers');
  },

  // Get customers count
  getCustomersCount: async (): Promise<number> => {
    const result = await pool.query('SELECT COUNT(*) as count FROM demo.customers');
    return parseInt(result.rows[0].count);
  }
};

export default pool;
