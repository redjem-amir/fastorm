// Pattern - Factory

// Ce pattern permet de centraliser et encapsuler la logique de création d’un objet complexe.
// Ici, on s’assure qu’il n’y ait qu’un seul `Pool` de connexion à PostgreSQL (singleton "fabriqué").
// Cela simplifie la configuration et évite les duplications ou erreurs d'initialisation.

import { Pool } from 'pg';

export class PoolFactory {
  // Instance unique du pool (Pattern Factory + Singleton interne)
  private static pool: Pool;

  // Configuration du pool (stockée temporairement avant la création)
  private static config: any;

  // Méthode de configuration initiale (appelée par l’utilisateur de la lib)
  static setConfig(config: any) {
    this.config = config;
  }

  // Méthode "usine" : crée et retourne une seule instance de `Pool`
  static async create(): Promise<Pool> {
    if (!this.pool) {
      if (!this.config) {
        throw new Error('Pool config not set.');
      }

      this.pool = new Pool(this.config);
      await this.pool.connect(); // Connexion immédiate au moment de la création
    }
    return this.pool;
  }

  // Fournit l’instance existante du pool (si elle a déjà été créée)
  static getPool(): Pool {
    if (!this.pool) {
      throw new Error('Pool not initialized');
    }
    return this.pool;
  }
}

// Fonction utilitaire appelée depuis le module d’entrée (`forRoot`)
export function setPoolOptions(cfg: any) {
  PoolFactory.setConfig(cfg);
}

// Fonction de démarrage explicite pour initialiser la connexion
export const initDb = async () => {
  await PoolFactory.create();
};