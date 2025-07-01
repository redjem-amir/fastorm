/**
 * Pattern : Singleton
 *
 * Ce composant centralise l'enregistrement et la consultation des métadonnées des entités ORM.
 * Il implémente le pattern Singleton pour garantir une instance unique partagée à travers
 * toute l'application.
 *
 * Les métadonnées collectées ici (entités, colonnes, clés primaires, colonnes générées, etc.)
 * sont utilisées par les différentes couches du système : synchronisation, persistance, requêtes.
 */

/**
 * Représente les métadonnées associées à une entité.
 */
export interface EntityMetadata {
  target: Function;     // Référence au constructeur de la classe (ex: User, Post, etc.)
  tableName: string;    // Nom logique de la table en base
}

/**
 * Représente les métadonnées associées à une colonne d'une entité.
 */
export interface ColumnMetadata {
  target: Function;     // Référence au constructeur de la classe contenant la colonne
  propertyName: string; // Nom de la propriété décorée
  primary?: boolean;    // Indique si la colonne est une clé primaire
  generated?: boolean;  // Indique si la colonne est auto-générée (ex: SERIAL, AUTO_INCREMENT)
}

/**
 * Type de relation entre entités.
 */
export type RelationType = 'OneToOne' | 'OneToMany' | 'ManyToOne' | 'ManyToMany';

/**
 * Métadonnées associées à une relation entre entités.
 */
export interface RelationMetadata {
  target: Function;              // Classe source contenant la propriété décorée
  propertyName: string;          // Nom de la propriété relationnelle (ex: "author")
  relationType: RelationType;    // Type de relation (ManyToOne, etc.)
  relatedEntity: () => Function; // Fonction retournant la classe cible de la relation
}

export class MetadataStorage {
  /**
   * Instance unique du Singleton.
   * Accessible via `getInstance()`.
   */
  private static instance: MetadataStorage;

  /**
   * Registre des entités déclarées avec `@Entity`.
   */
  private entities: EntityMetadata[] = [];

  /**
   * Registre des colonnes décorées avec `@Column`, `@PrimaryColumn`, etc.
   */
  private columns: ColumnMetadata[] = [];

    
  private relations: RelationMetadata[] = [];
  
  /**
   * Constructeur privé : empêche l'instanciation externe.
   */
  private constructor() { }

  /**
   * Point d'accès global à l'instance unique de `MetadataStorage`.
   */
  static getInstance(): MetadataStorage {
    if (!MetadataStorage.instance) {
      MetadataStorage.instance = new MetadataStorage();
    }
    return MetadataStorage.instance;
  }

  /**
   * Enregistre une entité dans le registre.
   * @param entity Métadonnées de l'entité
   */
  addEntity(entity: EntityMetadata) {
    this.entities.push(entity);
  }

  /**
   * Retourne la liste complète des entités enregistrées.
   */
  getEntities(): EntityMetadata[] {
    return this.entities;
  }

  /**
   * Recherche les métadonnées d'une entité à partir de sa classe.
   * @param target Le constructeur de l'entité recherchée
   */
  getEntity(target: Function): EntityMetadata | undefined {
    return this.entities.find(e => e.target === target);
  }

  /**
   * Enregistre une colonne dans le registre.
   * @param column Métadonnées de la colonne
   */
  addColumn(column: ColumnMetadata) {
    this.columns.push(column);
  }

  /**
   * Retourne les colonnes associées à une classe donnée.
   * @param target Le constructeur de l'entité
   */
  getColumns(target: Function): ColumnMetadata[] {
    return this.columns.filter(c => c.target === target);
  }

  /**
   * Enregistre une relation entre deux entités.
   * @param relation Métadonnées de la relation à ajouter
   */
  addRelation(relation: RelationMetadata) {
    this.relations.push(relation);
  }

  /**
   * Retourne les relations définies pour une entité donnée.
   * @param target Le constructeur de l'entité
   */
  getRelations(target: Function): RelationMetadata[] {
    return this.relations.filter(r => r.target === target);
  }
}