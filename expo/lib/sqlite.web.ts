export interface SQLiteDatabase {
  execSync(_source: string): void;
  runSync(_source: string, _params?: unknown[]): void;
  getFirstSync(_source: string, _params?: unknown[]): unknown;
  getAllSync(_source: string, _params?: unknown[]): unknown[];
}

class UnsupportedWebDatabase implements SQLiteDatabase {
  execSync(_source: string): void {
    throw new Error('SQLite is not available on web.');
  }

  runSync(_source: string, _params?: unknown[]): void {
    throw new Error('SQLite is not available on web.');
  }

  getFirstSync(_source: string, _params?: unknown[]): unknown {
    throw new Error('SQLite is not available on web.');
  }

  getAllSync(_source: string, _params?: unknown[]): unknown[] {
    throw new Error('SQLite is not available on web.');
  }
}

export const openDatabaseSync = (_name: string): SQLiteDatabase => {
  return new UnsupportedWebDatabase();
};
