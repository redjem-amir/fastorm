export interface EntityMetadata {
  target: Function;
  tableName: string;
}

export interface ColumnMetadata {
  target: Function;
  propertyName: string;
  primary?: boolean;
}

export class MetadataStorage {
  static entities: EntityMetadata[] = [];
  static columns: ColumnMetadata[] = [];

  static getEntity(target: Function) {
    return this.entities.find(e => e.target === target);
  }

  static getColumns(target: Function) {
    return this.columns.filter(c => c.target === target);
  }
}
