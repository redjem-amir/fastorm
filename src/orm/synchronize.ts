import { PoolFactory } from '../db/connection';               // Pattern : Factory – gestion centralisée du Pool PostgreSQL
import { MetadataStorage } from '../metadata/metadataStorage'; // Pattern : Singleton – registre global des métadonnées
import { globalEvents } from '../metadata/events';            // Pattern : Observer – pour notifier les événements ORM

/**
 * Synchronise les entités ORM avec la base de données en générant dynamiquement les tables SQL.
 *
 * Pour chaque entité enregistrée via le décorateur `@Entity`, cette fonction génère et exécute
 * une instruction `CREATE TABLE IF NOT EXISTS` basée sur les métadonnées des colonnes.
 *
 * Elle est appelée automatiquement lors de `FastOrmModule.forRoot({ synchronize: true })`
 * ou manuellement selon les besoins.
 *
 * @throws En cas d'erreur SQL ou d'incohérence de métadonnées.
 */
export async function synchronize(): Promise<void> {
  const storage = MetadataStorage.getInstance();
  const pool = PoolFactory.getPool();

  // Parcours de toutes les entités enregistrées
  for (const entity of storage.getEntities()) {
    const columns = storage.getColumns(entity.target);

    // Avertissement si aucune colonne n’est définie pour l'entité
    if (!columns.length) {
      console.warn(`No columns defined for entity: ${entity.tableName}`);
      continue;
    }

    // Génération dynamique des définitions de colonnes (ex: "id SERIAL PRIMARY KEY")
    const columnDefs = columns.map(col => {
      const type = col.generated ? 'SERIAL' : 'VARCHAR(255)';
      const isPrimary = col.primary ? 'PRIMARY KEY' : '';
      return `${col.propertyName} ${type} ${isPrimary}`.trim();
    });

    const sql = `CREATE TABLE IF NOT EXISTS ${entity.tableName} (${columnDefs.join(', ')});`;

    try {
      // Exécution de la requête de création
      await pool.query(sql);

      // Observer Pattern : émission d’un événement de synchronisation
      globalEvents.emit?.('synchronize', entity.tableName);
    } catch (err) {
      console.error(`Failed to create table "${entity.tableName}":`, err);
      throw err;
    }
  }
}