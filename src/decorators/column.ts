import { MetadataStorage } from '../metadata/metadataStorage';

export function Column(): PropertyDecorator {
  return (target, propertyKey) => {
    MetadataStorage.columns.push({
      target: target.constructor,
      propertyName: propertyKey.toString(),
    });
  };
}
