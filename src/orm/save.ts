import { pool } from '../db/connection';
import { MetadataStorage } from '../metadata/metadataStorage';

export async function save<T extends object>(entity: T): Promise<void> {
  const constructor = (entity as any).constructor;
  const entityMeta = MetadataStorage.getEntity(constructor);
  const columns = MetadataStorage.getColumns(constructor);

  if (!entityMeta || columns.length === 0) {
    throw new Error('Entity metadata not found');
  }

  const table = entityMeta.tableName;
  const columnNames = columns.map(c => c.propertyName);
  const values = columnNames.map(col => (entity as any)[col]);
  const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');

  const sql = `INSERT INTO ${table} (${columnNames.join(', ')}) VALUES (${placeholders})`;
  await pool.query(sql, values);
}

