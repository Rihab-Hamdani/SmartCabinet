declare module 'react-native-sqlite-2' {
    interface SQLiteDatabase {
      transaction(
        callback: (tx: SQLiteTransaction) => void,
        error?: (error: any) => void,
        success?: () => void
      ): void;
    }
  
    interface SQLiteTransaction {
      executeSql(
        sql: string,
        params?: any[],
        success?: (tx: SQLiteTransaction, result: SQLiteResultSet) => void,
        error?: (tx: SQLiteTransaction, error: any) => boolean
      ): void;
    }
  
    interface SQLiteResultSet {
      insertId: number;
      rowsAffected: number;
      rows: {
        length: number;
        item: (index: number) => any;
        raw: () => any[];
      };
    }
  
    interface SQLiteStatic {
      openDatabase(
        name: string,
        version: string,
        description: string,
        size: number
      ): SQLiteDatabase;
    }
  
    const SQLite: SQLiteStatic;
    export default SQLite;
  }