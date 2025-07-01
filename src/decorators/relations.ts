import { MetadataStorage, RelationType } from '../metadata/metadataStorage';

/**
 * Fabrique générique pour les décorateurs de relation (`@ManyToOne`, etc.).
 *
 * @param type Type de relation (ManyToOne, etc.)
 */
function createRelationDecorator(type: RelationType) {
  return (relatedEntity: () => Function): PropertyDecorator => {
    return (target, propertyKey) => {
      MetadataStorage.getInstance().addRelation({
        target: target.constructor,
        propertyName: propertyKey.toString(),
        relationType: type,
        relatedEntity,
      });
    };
  };
}

/**
 * Décorateur pour une relation N:1 (ex: un `Post` appartient à un seul `User`)
 */
export const ManyToOne = createRelationDecorator('ManyToOne');

/**
 * Décorateur pour une relation 1:N (ex: un `User` possède plusieurs `Posts`)
 */
export const OneToMany = createRelationDecorator('OneToMany');

/**
 * Décorateur pour une relation 1:1 (ex: un `User` possède un `Profile`)
 */
export const OneToOne = createRelationDecorator('OneToOne');

/**
 * Décorateur pour une relation N:N (ex: un `Student` a plusieurs `Courses`)
 */
export const ManyToMany = createRelationDecorator('ManyToMany');