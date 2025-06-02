import { Pool } from 'pg';

let poolConfig: any = {};
export let pool: Pool;

export function setPoolOptions(config: any) {
  poolConfig = config;
}

export const initDb = async () => {
  pool = new Pool(poolConfig);
  await pool.connect();
};
