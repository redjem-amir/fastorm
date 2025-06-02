import { DynamicModule, Global, Module } from '@nestjs/common';
import { FastOrmService } from './fastorm.service';
import { synchronize } from './orm/synchronize';
import { initDb, setPoolOptions } from './db/connection';
import { EntityRegistry } from './metadata/entityRegistry';

@Global()
@Module({})
export class FastOrmModule {
  static async forRoot(options: {
    host: string;
    port: number;
    username: string;
    password: string;
    database: string;
    synchronize?: boolean;
    entities?: Function[];
  }): Promise<DynamicModule> {
    setPoolOptions({
      user: options.username,
      host: options.host,
      database: options.database,
      password: options.password,
      port: options.port,
    });

    await initDb();

    if (options.entities) {
      EntityRegistry.addEntities(options.entities);
    }

    if (options.synchronize) {
      await synchronize();
    }

    return {
      module: FastOrmModule,
      providers: [FastOrmService],
      exports: [FastOrmService],
    };
  }

  static forFeature(entities: Function[]): DynamicModule {
    EntityRegistry.addEntities(entities);

    return {
      module: FastOrmModule,
      providers: [],
      exports: [],
    };
  }
}
