import { MetadataStorage } from '../metadata/metadataStorage';

/**
 * Décorateur de classe utilisé pour marquer une classe comme étant une entité persistable.
 *
 * Ce décorateur enregistre la classe dans le registre de métadonnées global (`MetadataStorage`)
 * afin qu’elle soit reconnue par l’ORM pour :
 * - la génération du schéma SQL (`synchronize()`)
 * - les opérations de persistance (`save()`, `find()`, etc.)
 *
 * Si aucun nom de table n’est spécifié, le nom de la classe sera utilisé en minuscules.
 *
 * Exemple d'utilisation :
 * ```ts
 * @Entity('users')
 * export class User { ... }
 * ```
 *
 * @param tableName Nom optionnel de la table en base de données.
 * @returns Un décorateur de classe conforme à la spécification TypeScript.
 */
export function Entity(tableName?: string): ClassDecorator {
  return (target) => {
    MetadataStorage.getInstance().addEntity({
      target,                                 // Référence au constructeur de la classe
      tableName: tableName || target.name.toLowerCase(), // Nom de la table associé à l’entité
    });
  };
}