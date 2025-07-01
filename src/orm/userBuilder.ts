/**
 * Pattern : Builder
 *
 * Implémentation générique du pattern Builder appliqué à la construction d'entités ORM.
 * Ce pattern permet d’instancier et configurer un objet de manière fluide (`chaining`),
 * sans exposer directement les propriétés de l’instance.
 *
 * Il est particulièrement utile dans des contextes de tests, de fixtures ou
 * pour générer des entités dynamiquement tout en restant typesafe.
 */
export class EntityBuilder<T extends object> {
  /**
   * Instance en cours de construction.
   */
  private entity: T;

  /**
   * Initialise une nouvelle instance de l'entité cible.
   *
   * @param EntityClass Le constructeur de l'entité (ex: User, Product, etc.)
   */
  constructor(EntityClass: new () => T) {
    this.entity = new EntityClass();
  }

  /**
   * Définit une propriété sur l'entité en construction.
   *
   * @param key Le nom de la propriété à définir
   * @param value La valeur à attribuer
   * @returns L'instance du builder pour permettre l'enchaînement des appels
   */
  set<K extends keyof T>(key: K, value: T[K]): this {
    this.entity[key] = value;
    return this;
  }

  /**
   * Finalise la construction et retourne l’instance complète.
   *
   * @returns L’objet construit de type `T`
   */
  build(): T {
    return this.entity;
  }
}