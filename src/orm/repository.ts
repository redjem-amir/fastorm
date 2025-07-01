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
import { MetadataStorage } from '../metadata/metadataStorage'; // Pattern : Singleton → centralise les métadonnées ORM

/**
 * Type représentant un critère de sélection dynamique pour les méthodes `findOne`, `delete`, `update`.
 */
type Criteria<T> = Partial<Record<keyof T, any>>;

export class Repository<T extends object> {
  private table: string;
  private EntityClass: new () => T;

  /**
   * Initialise le repository pour une entité donnée.
   * Récupère les métadonnées de l'entité depuis le registre central.
   *
   * @param EntityClass Le constructeur de l'entité (ex: User)
   */
  constructor(EntityClass: new () => T) {
    const storage = MetadataStorage.getInstance();
    const entityMeta = storage.getEntity(EntityClass);

    if (!entityMeta) {
      throw new Error(`Entity not registered: ${EntityClass.name}`);
    }

    this.table = entityMeta.tableName;
    this.EntityClass = EntityClass;
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
   * @param withRelations Indique s’il faut charger les relations (ManyToOne uniquement).
   * @returns Tableau d’objets typés représentant les lignes.
   */
  async findAll(withRelations = false): Promise<T[]> {
    const pool = PoolFactory.getPool();
    const res = await pool.query(`SELECT * FROM ${this.table}`);
    const rows = res.rows;

    if (withRelations) {
      return Promise.all(rows.map(row => this.loadRelations(row)));
    }

    return rows;
  }

  /**
   * Récupère une seule ligne correspondant au critère fourni.
   *
   * @param criteria Objet contenant les champs à filtrer (ex: { id: 1 })
   * @param withRelations Indique s’il faut charger les relations (ManyToOne uniquement).
   * @returns Une instance de l’entité ou `null` si aucune correspondance.
   */
  async findOne(criteria: Criteria<T>, withRelations = false): Promise<T | null> {
    const pool = PoolFactory.getPool();
    const where = this.buildWhere(criteria);
    const sql = `SELECT * FROM ${this.table} WHERE ${where.clause} LIMIT 1`;
    const res = await pool.query(sql, where.values);
    const entity = res.rows[0] ?? null;

    if (entity && withRelations) {
      return this.loadRelations(entity);
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
    const sql = `DELETE FROM ${this.table} WHERE ${where.clause}`;
    await pool.query(sql, where.values);
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

    const sql = `UPDATE ${this.table} SET ${setClause} WHERE ${where.clause}`;
    await pool.query(sql, [...setValues, ...where.values]);
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
   * Charge les relations ManyToOne pour une entité (jointures simples par lookup).
   *
   * @param entity Instance partielle retournée par le SELECT
   * @returns Une instance enrichie avec les relations
   */
  private async loadRelations(entity: any): Promise<any> {
    const storage = MetadataStorage.getInstance();
    const relations = storage.getRelations(this.EntityClass);

    for (const rel of relations) {
      if (rel.relationType === 'ManyToOne') {
        const relatedRepo = new Repository<any>(rel.relatedEntity() as any);
        const relatedId = entity[`${rel.propertyName}_id`];
        if (relatedId !== undefined) {
          const related = await relatedRepo.findOne({ id: relatedId });
          entity[rel.propertyName] = related;
        }
      }
    }

    return entity;
  }
}