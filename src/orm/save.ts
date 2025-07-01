import { PoolFactory } from '../db/connection';             // Pattern : Factory – gestion centralisée du Pool PostgreSQL
import { MetadataStorage } from '../metadata/metadataStorage'; // Pattern : Singleton – registre global des métadonnées ORM
import { globalEvents } from '../metadata/events';          // Pattern : Observer – gestion des événements ORM

/**
 * Persiste une instance d’entité dans la base de données.
 *
 * Génère dynamiquement une requête `INSERT` à partir des métadonnées enregistrées
 * via les décorateurs `@Entity`, `@Column`, `@PrimaryGeneratedColumn`, etc.
 *
 * Cette fonction est appelée par le repository ou peut être utilisée directement.
 *
 * @param entity Instance de l’entité à insérer.
 * @throws Si les métadonnées de l’entité ne sont pas disponibles ou si la requête échoue.
 */
export async function save<T extends object>(entity: T): Promise<void> {
  const storage = MetadataStorage.getInstance();
  const constructor = (entity as any).constructor;

  // Récupération des métadonnées de l’entité (nom de table, colonnes, etc.)
  const entityMeta = storage.getEntity(constructor);
  const columns = storage.getColumns(constructor);

  if (!entityMeta || columns.length === 0) {
    throw new Error(`Entity metadata not found for ${constructor.name}`);
  }

  const table = entityMeta.tableName;

  // Filtrage des colonnes à insérer : ignore les colonnes auto-générées si elles ne sont pas définies
  const insertableColumns = columns.filter(col => {
    const value = (entity as any)[col.propertyName];
    return !(col.generated && value === undefined);
  });

  const columnNames = insertableColumns.map(c => c.propertyName);
  const values = columnNames.map(col => (entity as any)[col]);
  const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');

  const sql = `INSERT INTO ${table} (${columnNames.join(', ')}) VALUES (${placeholders})`;

  try {
    const pool = PoolFactory.getPool(); // Factory Pattern : accès au singleton du pool PostgreSQL
    await pool.query(sql, values);

    // Observer Pattern : émission d’un événement 'save' à destination des listeners
    globalEvents.emit?.('save', entity);
  } catch (error) {
    console.error(`Error saving entity to table "${table}":`, error);
    throw error;
  }
}
