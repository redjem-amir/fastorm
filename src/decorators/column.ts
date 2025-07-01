import { MetadataStorage } from '../metadata/metadataStorage';

/**
 * Décorateur de propriété indiquant que le champ doit être mappé à une colonne de base de données.
 *
 * Lorsqu'il est appliqué à une propriété de classe, ce décorateur enregistre les métadonnées
 * nécessaires dans le registre central (`MetadataStorage`) pour permettre :
 * - la génération automatique du schéma (`synchronize()`)
 * - les opérations de persistance (`save()`)
 *
 * Exemple d'utilisation :
 * ```ts
 * @Column()
 * nom: string;
 * ```
 *
 * @returns Un décorateur de propriété conforme à la spécification TypeScript.
 */
export function Column(): PropertyDecorator {
  return (target, propertyKey) => {
    MetadataStorage.getInstance().addColumn({
      target: target.constructor,            // Référence au constructeur de la classe cible
      propertyName: propertyKey.toString(),  // Nom de la propriété décorée
    });
  };
}
