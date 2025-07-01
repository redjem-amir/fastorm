import { MetadataStorage } from './metadataStorage';

/**
 * Utilitaire interne pour enregistrer un ensemble d'entités dans le registre de métadonnées global.
 *
 * Cette classe est principalement utilisée par le module `FastOrmModule` lors de l'appel à `forRoot()` ou `forFeature()`,
 * afin de déclarer dynamiquement les entités à gérer par l'ORM.
 *
 * Elle évite les doublons en vérifiant si une entité a déjà été enregistrée.
 */
export class EntityRegistry {
  /**
   * Ajoute une liste d'entités (classes décorées avec `@Entity`) dans `MetadataStorage`.
   *
   * @param entities Tableau de classes représentant des entités métiers.
   */
  static addEntities(entities: Function[]) {
    const storage = MetadataStorage.getInstance();

    for (const entity of entities) {
      const alreadyExists = storage.getEntities().some(e => e.target === entity);

      if (!alreadyExists) {
        storage.addEntity({
          target: entity,                            // Référence à la classe de l'entité
          tableName: entity.name.toLowerCase(),      // Nom de table dérivé automatiquement (ex: "User" → "user")
        });
      }
    }
  }
}