import { MetadataStorage } from '../metadata/metadataStorage';

/**
 * Décorateur de propriété indiquant que le champ est une clé primaire auto-générée.
 *
 * Ce décorateur enregistre la propriété comme une colonne de type `PRIMARY KEY` avec génération automatique.
 * Typiquement utilisé pour les colonnes de type `SERIAL` ou `AUTO_INCREMENT`.
 *
 * Exemple d'utilisation :
 * ```ts
 * @PrimaryGeneratedColumn()
 * id: number;
 * ```
 *
 * @returns Un décorateur de propriété conforme à la spécification TypeScript.
 */
export function PrimaryGeneratedColumn(): PropertyDecorator {
  return (target, propertyKey) => {
    MetadataStorage.getInstance().addColumn({
      target: target.constructor,           // Référence à la classe contenant la propriété
      propertyName: propertyKey.toString(), // Nom de la propriété utilisée comme clé primaire
      primary: true,                        // Marque cette colonne comme clé primaire
      generated: true                       // Indique que la valeur est auto-générée (ex: SERIAL)
    });
  };
}