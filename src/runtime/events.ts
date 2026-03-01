export type EventHandler = (payload: unknown) => void | Promise<void>;

export interface EventBus {
  emit(event: string, payload: unknown): void;
  on(event: string, handler: EventHandler): void;
  off(event: string, handler: EventHandler): void;
}

export function createEventBus(): EventBus {
  throw new Error('not implemented');
}
