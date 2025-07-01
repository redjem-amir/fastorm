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
import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'fastorm';
import { Post } from './post.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @OneToMany(() => Post, post => post.author)
  posts: Post[];
}
```

``` typescript
import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from 'fastorm';
import { User } from './user.entity';

@Entity('posts')
export class Post {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @ManyToOne(() => User)
  author: User;
}
```

3. Sauvegarder une entité

``` typescript
import { save } from 'fastorm';

const user = new User();
user.name = 'Alice';

await save(user);
```

4. Utiliser le Repository

``` typescript
import { Repository } from 'fastorm';
import { User } from './user.entity';

const userRepo = new Repository(User);

// Récupérer tous les utilisateurs avec leurs posts
const users = await userRepo.findAll({ relations: ['posts'] });

// Rechercher un utilisateur par email
const u = await userRepo.findOne({ email: 'bob@demo.com' });
```

5. Utiliser le Builder

``` typescript
import { EntityBuilder, save } from 'fastorm';
import { User } from './user.entity';

const user = new EntityBuilder(User)
  .set('name', 'Jean')
  .build();

await save(user);
```

6. Synchroniser manuellement

``` typescript
import { synchronize } from 'fastorm';

await synchronize(); // Crée les tables SQL à partir des entités
```

## 🔗 Relations supportées

| Décorateur      | Description                                                  |
| --------------- | ------------------------------------------------------------ |
| `@ManyToOne()`  | Relation N:1 (ex: `Post.author → User`)                      |
| `@OneToMany()`  | Relation 1\:N (ex: `User.posts → Post[]`)                    |
| `@OneToOne()`   | Relation 1:1 (ex: `User.profile → Profile`)                  |
| `@ManyToMany()` | Relation N\:N (ex: `Student.courses → Course[]`) *(à venir)* |


## 📚 API

| Élément                          | Description                              |
| -------------------------------- | ---------------------------------------- |
| `@Entity(name?)`                 | Marque une classe comme entité           |
| `@Column()`                      | Marque une propriété comme colonne       |
| `@PrimaryColumn()`               | Clé primaire manuelle                    |
| `@PrimaryGeneratedColumn()`      | Clé primaire auto-générée (INT)          |
| `save(entity)`                   | Persiste une entité                      |
| `synchronize()`                  | Génère les tables                        |
| `new Repository(Entity)`         | Instancie un repo typé                   |
| `findAll({ relations })`         | Requête + chargement des relations       |
| `EntityBuilder(Entity).set(...)` | Pattern Builder pour générer des entités |

## ⚡ Performance

FastORM a été conçu avec un objectif clair : maximiser les performances sur PostgreSQL :

> ✅ Connexion via Pool unique (singleton)

> ✅ Requêtes SQL optimisées manuellement

> ✅ Chargement des relations ciblé (pas d'overhead généralisé)

> ✅ Pas de parsing complexe à runtime

> ✅ Bien plus rapide que TypeORM pour les cas CRUD simples

## 🧪 Exemple complet

1. Définir les entités

``` typescript
// user.model.ts
import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'fastorm';
import { Post } from './post.model';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @OneToMany(() => Post, post => post.author)
  posts: Post[];
}
```

``` typescript
// post.model.ts
import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from 'fastorm';
import { User } from './user.model';

@Entity('posts')
export class Post {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @ManyToOne(() => User)
  author: User;
}
```

2. Configurer FastORM dans le module principal

``` typescript
// app.module.ts
import { Module } from '@nestjs/common';
import { FastOrmModule } from 'fastorm';
import { User } from './user.entity';
import { Post } from './post.entity';

@Module({
  imports: [
    FastOrmModule.forRoot({
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: 'password',
      database: 'fastorm_db',
      synchronize: true,
      entities: [User, Post],
    }),
  ],
})

export class AppModule {}
```

3. Utiliser le Repository pour interagir avec la base

``` typescript
// example.ts
import { Repository } from 'fastorm';
import { User } from './user.entity';
import { Post } from './post.entity';

const userRepo = new Repository(User);
const postRepo = new Repository(Post);

// Créer un utilisateur
const user = new User();
user.name = 'Amir';
await userRepo.save(user);

// Créer un post associé
const post = new Post();
post.title = 'Hello World';
post.author = user;
await postRepo.save(post);

// Récupérer tous les utilisateurs avec leurs posts
const usersWithPosts = await userRepo.findAll({ relations: ['posts'] });

console.log(usersWithPosts);
```