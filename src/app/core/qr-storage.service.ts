import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { openDB, type IDBPDatabase } from 'idb';
import type { QrRecord } from '../data/qr.types';

const DB_NAME = 'qr-studio';
const DB_VERSION = 1;
const STORE = 'records';
const IDX_KIND_TIME = 'by_kind_createdAt';
const MAX_PER_KIND = 50;

interface Schema {
  readonly records: { key: string; value: QrRecord; indexes: { 'by_kind_createdAt': [string, number] } };
}

@Injectable({ providedIn: 'root' })
export class QrStorageService {
  private readonly platformId = inject(PLATFORM_ID);
  private dbPromise: Promise<IDBPDatabase<Schema>> | null = null;

  private db(): Promise<IDBPDatabase<Schema>> | null {
    if (!isPlatformBrowser(this.platformId)) return null;
    if (!this.dbPromise) {
      this.dbPromise = openDB<Schema>(DB_NAME, DB_VERSION, {
        upgrade(db) {
          const store = db.createObjectStore(STORE, { keyPath: 'id' });
          store.createIndex(IDX_KIND_TIME, ['kind', 'createdAt']);
        },
      });
    }
    return this.dbPromise;
  }

  async save(record: QrRecord): Promise<void> {
    const db = this.db();
    if (!db) return;
    const conn = await db;
    await conn.put(STORE, record);
    await this.trim(record.kind);
  }

  /** Newest first. */
  async list(kind: 'generated' | 'scanned', limit = 25): Promise<QrRecord[]> {
    const db = this.db();
    if (!db) return [];
    const conn = await db;
    const tx = conn.transaction(STORE, 'readonly');
    const idx = tx.store.index(IDX_KIND_TIME);
    const range = IDBKeyRange.bound([kind, -Infinity], [kind, Infinity]);
    const out: QrRecord[] = [];
    let cursor = await idx.openCursor(range, 'prev');
    while (cursor && out.length < limit) {
      out.push(cursor.value);
      cursor = await cursor.continue();
    }
    return out;
  }

  async clear(kind?: 'generated' | 'scanned'): Promise<void> {
    const db = this.db();
    if (!db) return;
    const conn = await db;
    if (!kind) {
      await conn.clear(STORE);
      return;
    }
    const tx = conn.transaction(STORE, 'readwrite');
    const idx = tx.store.index(IDX_KIND_TIME);
    const range = IDBKeyRange.bound([kind, -Infinity], [kind, Infinity]);
    let cursor = await idx.openCursor(range);
    while (cursor) {
      await cursor.delete();
      cursor = await cursor.continue();
    }
    await tx.done;
  }

  async remove(id: string): Promise<void> {
    const db = this.db();
    if (!db) return;
    const conn = await db;
    await conn.delete(STORE, id);
  }

  /** Keep only the most recent MAX_PER_KIND for each kind. */
  private async trim(kind: 'generated' | 'scanned'): Promise<void> {
    const db = this.db();
    if (!db) return;
    const conn = await db;
    const tx = conn.transaction(STORE, 'readwrite');
    const idx = tx.store.index(IDX_KIND_TIME);
    const range = IDBKeyRange.bound([kind, -Infinity], [kind, Infinity]);
    const all: { key: IDBValidKey; createdAt: number }[] = [];
    let cursor = await idx.openCursor(range, 'prev');
    while (cursor) {
      all.push({ key: cursor.primaryKey, createdAt: cursor.value.createdAt });
      cursor = await cursor.continue();
    }
    for (const r of all.slice(MAX_PER_KIND)) {
      await tx.store.delete(r.key);
    }
    await tx.done;
  }
}
