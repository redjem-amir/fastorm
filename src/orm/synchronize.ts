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
    const relations = storage.getRelations(entity.target);

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

    // Gestion des relations OneToOne et ManyToOne
    for (const rel of relations) {
      if (rel.relationType === 'ManyToOne' || rel.relationType === 'OneToOne') {
        const refTable = rel.relatedEntity().name.toLowerCase();
        columnDefs.push(`${rel.propertyName}_id INTEGER`);
        columnDefs.push(`FOREIGN KEY (${rel.propertyName}_id) REFERENCES ${refTable}(id)`);
      }
    }

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

  // Création des tables de jointure ManyToMany
  const allRelations = storage['relations'] || [];

  for (const rel of allRelations) {
    if (rel.relationType === 'ManyToMany') {
      const entityA = rel.target;
      const entityB = rel.relatedEntity();

      const entityAName = entityA.name.toLowerCase();
      const entityBName = entityB.name.toLowerCase();

      // Nom de la table pivot (ex: "user_roles")
      const joinTable = [entityAName, entityBName].sort().join('_');

      const colA = `${entityAName}_id`;
      const colB = `${entityBName}_id`;

      const sql = `
        CREATE TABLE IF NOT EXISTS ${joinTable} (
          ${colA} INTEGER NOT NULL,
          ${colB} INTEGER NOT NULL,
          PRIMARY KEY (${colA}, ${colB}),
          FOREIGN KEY (${colA}) REFERENCES ${entityAName}(id),
          FOREIGN KEY (${colB}) REFERENCES ${entityBName}(id)
        );
      `;

      try {
        await pool.query(sql);
        globalEvents.emit?.('synchronize', joinTable);
      } catch (err) {
        console.error(`Failed to create join table "${joinTable}":`, err);
        throw err;
      }
    }
  }
}