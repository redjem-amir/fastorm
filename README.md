<div align="center">
  <a href="https://https://github.com/redjem-amir/nestjs-fastorm">
    <picture>
        <source media="(prefers-color-scheme: dark)" srcset="https://github.com/redjem-amir/nestjs-fastorm/blob/main/resources/fastorm-logo-colored-dark.png">
        <source  media="(prefers-color-scheme: light)" srcset="https://github.com/redjem-amir/nestjs-fastorm/blob/main/resources/fastorm-logo-colored-light.png">
        <img height="300" width="auto" alt="fastorm Logo" src="https://github.com/redjem-amir/nestjs-fastorm/blob/main/resources/fastorm-logo-colored-light.png">
    </picture>
  </a>
  <br>
  <br>
</div>

Un ORM minimaliste pour PostgreSQL, conçu pour s'intégrer facilement avec NestJS. Il fournit des décorateurs pour définir des entités, colonnes et clés primaires, ainsi qu'une méthode de synchronisation et de sauvegarde des entités.

## 📦 Installation

``` bash
npm install fastorm
# ou
yarn add fastorm
```

## 🚀 Utilisation avec NestJS

1. Configuration du module

Dans ton fichier AppModule :
``` typescript
import { Module } from '@nestjs/common';
import { FastOrmModule } from 'fastorm';
import { User } from './user.entity';

@Module({
  imports: [
    FastOrmModule.forRoot({
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: 'password',
      database: 'mydb',
      synchronize: true, // Crée les tables automatiquement
      entities: [User],   // Entités à enregistrer
    }),
  ],
})
export class AppModule {}
```

2. Définir une entité

``` typescript
// user.entity.ts
import { Entity, Column, PrimaryGeneratedColumn } from 'fastorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  email: string;
}
```

3. Sauvegarder une entité

``` typescript
import { save } from 'fastorm';
import { User } from './user.entity';

const user = new User();
user.name = 'Alice';
user.email = 'alice@example.com';

await save(user);
```

4. Synchroniser manuellement la base (optionnel)

``` typescript
import { synchronize } from 'fastorm';

await synchronize(); // Crée les tables à partir des entités
```

## 📚 API

| Décorateur                  | Description                        |
| --------------------------- | ---------------------------------- |
| `@Entity(tableName?)`       | Marque une classe comme entité     |
| `@Column()`                 | Marque une propriété comme colonne |
| `@PrimaryColumn()`          | Clé primaire manuelle              |
| `@PrimaryGeneratedColumn()` | Clé primaire auto-générée (INT)    |

## 🧪 Exemple complet

``` typescript
@Module({
  imports: [
    FastOrmModule.forRoot({
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: 'pass',
      database: 'test',
      synchronize: true,
      entities: [User],
    }),
  ],
})

export class AppModule {}
```