import { MetadataStorage } from '../metadata/metadataStorage';

export function Entity(tableName?: string): ClassDecorator {
  return (target) => {
    MetadataStorage.entities.push({
      target,
      tableName: tableName || target.name.toLowerCase(),
    });
  };
}
