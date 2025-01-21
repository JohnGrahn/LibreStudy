import { Pool, PoolClient } from 'pg';

// Extend PoolClient type to include lastQuery
interface ExtendedPoolClient extends PoolClient {
  lastQuery?: any;
}

// Parse DATABASE_URL if available, otherwise use default config
const parseDbUrl = (url: string) => {
  const pattern = /^postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)$/;
  const match = url.match(pattern);
  if (!match) {
    throw new Error('Invalid DATABASE_URL format');
  }
  const [, user, password, host, port, database] = match;
  return { user, password, host, port: parseInt(port), database };
};

// Database configuration
const config = process.env.DATABASE_URL
  ? parseDbUrl(process.env.DATABASE_URL)
  : {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'librestudy',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'librestudy',
    };

// Add connection pool settings
const poolConfig = {
  ...config,
  max: parseInt(process.env.DB_POOL_SIZE || '20'),
  idleTimeoutMillis: 30000,
};

// Create a new pool instance
const pool = new Pool(poolConfig);

// The pool will emit an error on behalf of any idle clients
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// Helper function to get a client from the pool
export const getClient = async (): Promise<ExtendedPoolClient> => {
  const client = await pool.connect() as ExtendedPoolClient;
  const query = client.query.bind(client);
  const release = client.release.bind(client);

  // Monkey patch the query method to keep track of last query
  client.query = (...args: Parameters<typeof query>) => {
    client.lastQuery = args;
    return query(...args);
  };

  client.release = () => {
    // Clear last query before releasing
    delete client.lastQuery;
    return release();
  };

  return client;
};

// Export pool for use in other modules
export default pool; 