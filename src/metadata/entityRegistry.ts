import { MetadataStorage } from './metadataStorage';

export class EntityRegistry {
  static addEntities(entities: Function[]) {
    for (const entity of entities) {
      const alreadyExists = MetadataStorage.entities.some(e => e.target === entity);
      if (!alreadyExists) {
        MetadataStorage.entities.push({
          target: entity,
          tableName: entity.name.toLowerCase(),
        });
      }
    }
  }
}
