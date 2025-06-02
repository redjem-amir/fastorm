import { pool } from '../db/connection';
import { MetadataStorage } from '../metadata/metadataStorage';

export async function synchronize(): Promise<void> {
  for (const entity of MetadataStorage.entities) {
    const columns = MetadataStorage.getColumns(entity.target);

    const columnDefs = columns.map(col => {
      const type = 'VARCHAR(255)';
      const isPrimary = col.primary ? 'PRIMARY KEY' : '';
      return `${col.propertyName} ${type} ${isPrimary}`.trim();
    });

    const query = `CREATE TABLE IF NOT EXISTS ${entity.tableName} (${columnDefs.join(', ')});`;
    await pool.query(query);
  }
}
