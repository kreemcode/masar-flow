import Dexie, { Table } from 'dexie';
import { Workflow } from '../types';

class MasarDatabase extends Dexie {
  workflows!: Table<Workflow, number>;

  constructor() {
    super('MasarDB');
    // Fix: Cast this to any to resolve TypeScript error regarding version property
    (this as any).version(1).stores({
      workflows: '++id, title, isPrivate, createdAt'
    });
  }
}

export const db = new MasarDatabase();