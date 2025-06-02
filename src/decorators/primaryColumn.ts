import { MetadataStorage } from '../metadata/metadataStorage';

export function PrimaryColumn(): PropertyDecorator {
  return (target, propertyKey) => {
    MetadataStorage.columns.push({
      target: target.constructor,
      propertyName: propertyKey.toString(),
      primary: true,
    });
  };
}
