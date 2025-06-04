import { MetadataStorage } from '../metadata/metadataStorage';

export function PrimaryGeneratedColumn(): PropertyDecorator {
  return (target, propertyKey) => {
    MetadataStorage.columns.push({
      target: target.constructor,
      propertyName: propertyKey.toString(),
      primary: true,
      generated: true
    });
  };
}
