/**
 * Pattern : Observer
 *
 * Cette implémentation permet de gérer un système d’événements interne au sein de l’ORM.
 * Elle facilite le découplage entre les producteurs d’événements (ex : opérations `save`, `synchronize`)
 * et les consommateurs (ex : logs, hooks personnalisés, extensions).
 *
 * Chaque type d’événement peut avoir plusieurs observateurs (listeners), invoqués dynamiquement.
 */

/**
 * Événements supportés par le système interne.
 * Étendable selon les besoins futurs (ex: 'update', 'delete', etc.)
 */
type EventName = 'save' | 'synchronize';

/**
 * Type générique d’un listener : une fonction réactive déclenchée à l’émission d’un événement.
 */
type Listener = (...args: any[]) => void;

export class EventEmitter {
  /**
   * Stockage interne des listeners, regroupés par nom d'événement.
   */
  private listeners: { [K in EventName]?: Listener[] } = {};

  /**
   * Abonne un listener à un événement donné.
   *
   * @param evt Nom de l’événement à écouter.
   * @param fn Fonction à exécuter lors de l’émission de cet événement.
   */
  on(evt: EventName, fn: Listener) {
    (this.listeners[evt] = this.listeners[evt] || []).push(fn);
  }

  /**
   * Déclenche un événement et notifie tous les listeners associés.
   *
   * @param evt Nom de l’événement.
   * @param args Arguments transmis à chaque listener.
   */
  emit(evt: EventName, ...args: any[]) {
    (this.listeners[evt] || []).forEach(fn => fn(...args));
  }
}

/**
 * Instance globale d’EventEmitter.
 *
 * Permet à n’importe quel composant de la bibliothèque (ou de l’application)
 * de publier ou de s’abonner à des événements internes sans couplage direct.
 */
export const globalEvents = new EventEmitter();
