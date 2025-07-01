/**
 * Pattern : Repository
 *
 * Fournit une couche d'abstraction entre les entités métier et la base de données.
 * Ce pattern encapsule la logique d'accès aux données et isole les opérations CRUD (Create, Read, Update, Delete),
 * évitant ainsi l'exposition directe du SQL dans la logique applicative.
 *
 * La classe `Repository<T>` est générique et réutilisable pour n’importe quelle entité décorée par `@Entity`.
 */

import { save } from './save';
import { PoolFactory } from '../db/connection';           // Pattern : Factory → centralise la gestion du Pool PostgreSQL
import { MetadataStorage, RelationMetadata } from '../metadata/metadataStorage'; // Pattern : Singleton → centralise les métadonnées ORM

/**
 * Type représentant un critère de sélection dynamique pour les méthodes `findOne`, `delete`, `update`.
 */
type Criteria<T> = Partial<Record<keyof T, any>>;

/**
 * Options disponibles pour personnaliser les requêtes de lecture (`findAll`, `findOne`)
 */
interface FindOptions<T> {
  select?: (keyof T)[];
  limit?: number;
  orderBy?: { [K in keyof T]?: 'ASC' | 'DESC' };
  relations?: (keyof T)[];
}

export class Repository<T extends object> {
  private table: string;
  private EntityClass: new () => T;
  private metadata = MetadataStorage.getInstance();
  private relations: RelationMetadata[] = [];
  private static sqlCache = new Map<string, string>();

  /**
   * Initialise le repository pour une entité donnée.
   * Récupère les métadonnées de l'entité depuis le registre central.
   *
   * @param EntityClass Le constructeur de l'entité (ex: User)
   */
  constructor(EntityClass: new () => T) {
    const entityMeta = this.metadata.getEntity(EntityClass);

    if (!entityMeta) {
      throw new Error(`Entity not registered: ${EntityClass.name}`);
    }

    this.table = entityMeta.tableName;
    this.EntityClass = EntityClass;
    this.relations = this.metadata.getRelations(EntityClass);
  }

  /**
   * Insère une entité dans la base de données.
   *
   * @param entity L’instance de l’entité à sauvegarder.
   */
  async save(entity: T): Promise<void> {
    await save(entity);
  }

  /**
   * Récupère toutes les lignes de la table correspondant à l'entité.
   *
   * @param options Paramètres optionnels : sélection de colonnes, tri, relations, limite.
   * @returns Tableau d’objets typés représentant les lignes.
   */
  async findAll(options: FindOptions<T> = {}): Promise<T[]> {
    const pool = PoolFactory.getPool();

    const selectClause = this.buildSelectClause(options.select);
    const limitClause = options.limit ? `LIMIT ${options.limit}` : '';
    const orderClause = this.buildOrderClause(options.orderBy);

    const cacheKey = `${this.table}-findAll-${selectClause}-${orderClause}-${limitClause}`;
    const sql = this.getOrCacheSQL(cacheKey, () =>
      `SELECT ${selectClause} FROM ${this.table} ${orderClause} ${limitClause}`.trim()
    );

    const res = await pool.query({ name: cacheKey, text: sql });
    const rows = res.rows;

    if (options.relations?.length) {
      await this.loadRelations(rows, options.relations);
    }

    return rows;
  }

  /**
   * Récupère une seule ligne correspondant au critère fourni.
   *
   * @param criteria Objet contenant les champs à filtrer (ex: { id: 1 })
   * @param options Paramètres supplémentaires : relations, colonnes à charger...
   * @returns Une instance de l’entité ou `null` si aucune correspondance.
   */
  async findOne(criteria: Criteria<T>, options: FindOptions<T> = {}): Promise<T | null> {
    const pool = PoolFactory.getPool();
    const where = this.buildWhere(criteria);
    const selectClause = this.buildSelectClause(options.select);

    const cacheKey = `${this.table}-findOne-${Object.keys(criteria).join(',')}`;
    const sql = this.getOrCacheSQL(cacheKey, () =>
      `SELECT ${selectClause} FROM ${this.table} WHERE ${where.clause} LIMIT 1`
    );

    const res = await pool.query({ name: cacheKey, text: sql, values: where.values });
    const entity = res.rows[0] ?? null;

    if (entity && options.relations?.length) {
      await this.loadRelations([entity], options.relations);
    }

    return entity;
  }

  /**
   * Supprime une ou plusieurs lignes en fonction d’un critère.
   *
   * @param criteria Conditions de suppression (ex: { id: 1 })
   */
  async delete(criteria: Criteria<T>): Promise<void> {
    const pool = PoolFactory.getPool();
    const where = this.buildWhere(criteria);

    const cacheKey = `${this.table}-delete-${Object.keys(criteria).join(',')}`;
    const sql = this.getOrCacheSQL(cacheKey, () =>
      `DELETE FROM ${this.table} WHERE ${where.clause}`
    );

    await pool.query({ name: cacheKey, text: sql, values: where.values });
  }

  /**
   * Met à jour une ou plusieurs lignes correspondant à un critère donné.
   *
   * @param criteria Conditions de mise à jour
   * @param updates Champs à modifier
   */
  async update(criteria: Criteria<T>, updates: Partial<T>): Promise<void> {
    const pool = PoolFactory.getPool();
    const where = this.buildWhere(criteria);

    const setKeys = Object.keys(updates);
    const setClause = setKeys.map((k, i) => `${k} = $${i + 1}`).join(', ');
    const setValues = Object.values(updates);

    const cacheKey = `${this.table}-update-${setKeys.join(',')}-${Object.keys(criteria).join(',')}`;
    const sql = this.getOrCacheSQL(cacheKey, () =>
      `UPDATE ${this.table} SET ${setClause} WHERE ${where.clause}`
    );

    await pool.query({ name: cacheKey, text: sql, values: [...setValues, ...where.values] });
  }

  /**
   * Construit dynamiquement la clause WHERE d’une requête à partir d’un objet critère.
   *
   * @param criteria Champs et valeurs à utiliser dans la clause WHERE.
   * @returns Un objet `{ clause, values }` utilisé dans les requêtes SQL.
   */
  private buildWhere(criteria: Criteria<T>) {
    const keys = Object.keys(criteria);
    const clause = keys.map((k, i) => `${k} = $${i + 1}`).join(' AND ');
    const values = Object.values(criteria);
    return { clause, values };
  }

  /**
   * Construit dynamiquement une clause SELECT (liste de colonnes ou `*`).
   */
  private buildSelectClause(select?: (keyof T)[]): string {
    return select?.length ? select.join(', ') : '*';
  }

  /**
   * Construit dynamiquement une clause ORDER BY.
   */
  private buildOrderClause(orderBy?: { [K in keyof T]?: 'ASC' | 'DESC' }): string {
    if (!orderBy) return '';
    const parts = Object.entries(orderBy).map(([k, dir]) => `${k} ${dir}`);
    return `ORDER BY ${parts.join(', ')}`;
  }

  /**
   * Mécanisme de mise en cache local des requêtes SQL générées.
   *
   * @param key Clé unique de cache (ex: `user-findAll-*`)
   * @param builder Fonction qui génère le SQL si non déjà présent
   */
  private getOrCacheSQL(key: string, builder: () => string): string {
    if (!Repository.sqlCache.has(key)) {
      Repository.sqlCache.set(key, builder());
    }
    return Repository.sqlCache.get(key)!;
  }

  /**
   * Charge les relations ManyToOne spécifiées pour un tableau d’entités.
   *
   * @param rows Résultats SQL partiels (ex: [{ title: '...', author_id: 1 }])
   * @param relations Noms des propriétés relationnelles à charger (ex: ['author'])
   */
  private async loadRelations(rows: any[], relations: (keyof T)[]) {
    const pool = PoolFactory.getPool();

    for (const rel of this.relations) {
      const key = rel.propertyName as keyof T;
      if (!relations.includes(key)) continue;

      const foreignKey = `${rel.propertyName}_id`;
      const relatedEntity = rel.relatedEntity();
      const relatedMeta = this.metadata.getEntity(relatedEntity);
      if (!relatedMeta) continue;

      const relatedRepo = new Repository<any>(relatedEntity as any);
      const ids = [...new Set(rows.map(row => row[foreignKey]).filter(Boolean))];

      if (!ids.length) continue;

      const placeholders = ids.map((_, i) => `$${i + 1}`).join(', ');
      const sql = `SELECT * FROM ${relatedMeta.tableName} WHERE id IN (${placeholders})`;

      const res = await pool.query({ text: sql, values: ids });
      const map = new Map(res.rows.map(row => [row.id, row]));

      for (const row of rows) {
        row[rel.propertyName] = map.get(row[foreignKey]) ?? null;
      }
    }
  }
}