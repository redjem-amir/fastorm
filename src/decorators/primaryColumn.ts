import { MetadataStorage } from '../metadata/metadataStorage';

/**
 * Décorateur de propriété indiquant que le champ est une clé primaire non générée.
 *
 * Ce décorateur enregistre la colonne comme clé primaire dans le registre central (`MetadataStorage`).
 * Il est utilisé pour les colonnes dont la valeur est définie manuellement (par exemple une UUID ou un slug).
 *
 * Exemple d'utilisation :
 * ```ts
 * @PrimaryColumn()
 * id: string;
 * ```
 *
 * @returns Un décorateur de propriété conforme à la spécification TypeScript.
 */
export function PrimaryColumn(): PropertyDecorator {
  return (target, propertyKey) => {
    MetadataStorage.getInstance().addColumn({
      target: target.constructor,           // Référence à la classe contenant la propriété
      propertyName: propertyKey.toString(), // Nom de la propriété utilisée comme clé primaire
      primary: true,                        // Indique qu'il s'agit d'une clé primaire
    });
  };
}