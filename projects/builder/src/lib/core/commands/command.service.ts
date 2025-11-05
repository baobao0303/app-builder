import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export type CommandHandler = (payload?: any) => void | Promise<void>;

export interface CommandEvent {
  name: string;
  payload?: any;
}

@Injectable({ providedIn: 'root' })
export class CommandService {
  private registry = new Map<string, CommandHandler>();
  private eventsSubject = new Subject<CommandEvent>();
  readonly events$ = this.eventsSubject.asObservable();

  register(name: string, handler: CommandHandler): void {
    this.registry.set(name, handler);
  }

  unregister(name: string): void {
    this.registry.delete(name);
  }

  async run(name: string, payload?: any): Promise<void> {
    const handler = this.registry.get(name);
    this.eventsSubject.next({ name, payload });
    if (handler) {
      await handler(payload);
      return;
    }
    // No-op if not found; could throw or warn later
  }
}
