import SQLite from 'react-native-sqlite-2';

const DB_NAME = 'smartcabinet_v2.db'; 

let db: any = null;

export const getDatabase = () => {
  if (db) return db;
  db = SQLite.openDatabase(DB_NAME, '1.0', 'SmartCabinet', 5000000);
  return db;
};

// ✅ AJOUT DE EXECUTEQUERY (Pour voir l'historique)
export const executeQuery = (sql: string, params: any[] = []): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    getDatabase().transaction((tx: any) => {
      tx.executeSql(
        sql, params,
        (_: any, res: any) => {
          const rows: any[] = [];
          for (let i = 0; i < res.rows.length; i++) {
            rows.push(res.rows.item(i));
          }
          resolve(rows);
        },
        (_: any, err: any) => { reject(err); return false; }
      );
    });
  });
};

// ✅ EXÉCUTEUR D'INSERTION
export const executeInsert = (sql: string, params: any[] = []): Promise<number> => {
  return new Promise((resolve, reject) => {
    getDatabase().transaction((tx: any) => {
      tx.executeSql(
        sql, params,
        (_: any, res: any) => resolve(res.insertId ?? 0),
        (_: any, err: any) => { 
          console.error('❌ Erreur Insertion:', err);
          reject(err); 
          return false; 
        }
      );
    });
  });
};
const creerTables = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    getDatabase().transaction(
      (tx: any) => {
        tx.executeSql('PRAGMA foreign_keys = ON;');

        // 1. Table USERS
        tx.executeSql(`CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          role TEXT, nom TEXT, prenom TEXT, email TEXT UNIQUE,
          password TEXT, sexe TEXT, created_at TEXT DEFAULT (datetime('now'))
        );`);

        // 2. Table PATIENTS
        tx.executeSql(`CREATE TABLE IF NOT EXISTS patients (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          nom TEXT NOT NULL, prenom TEXT NOT NULL,
          cin TEXT, telephone TEXT, email TEXT,
          created_at TEXT DEFAULT (datetime('now'))
        );`);

        // 3. Table CONSULTATIONS
// Dans database.ts
tx.executeSql(`CREATE TABLE IF NOT EXISTS consultations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  patient_id INTEGER NOT NULL,
  date_cons TEXT NOT NULL, 
  symptomes TEXT,
  remarques_medecin TEXT, 
  notes TEXT, 
  antecedents TEXT,
  diagnostic TEXT,
  medicaments TEXT,
  FOREIGN KEY (patient_id) REFERENCES patients (id) ON DELETE CASCADE
);`);

        // 4. Table RENDEZ_VOUS
        tx.executeSql(`CREATE TABLE IF NOT EXISTS rendez_vous (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          patient_id INTEGER NOT NULL,
          date_heure TEXT NOT NULL, motif TEXT, statut TEXT DEFAULT 'confirmé',
          created_at TEXT DEFAULT (datetime('now')),
          FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
        );`);

        // 5. 🟢 TABLE STOCK (Indispensable pour vos services)
        tx.executeSql(`CREATE TABLE IF NOT EXISTS stock_equipements (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          nom TEXT NOT NULL,
          quantite INTEGER DEFAULT 0,
          unite TEXT DEFAULT 'unité',
          seuil_alerte INTEGER DEFAULT 5,
          categorie TEXT DEFAULT 'Général',
          description TEXT DEFAULT '',
          updated_at TEXT DEFAULT (datetime('now'))
        );`);

        // 6. 🟢 TABLE HISTORIQUE STOCK (Appelée dans stockservices.ts)
        tx.executeSql(`CREATE TABLE IF NOT EXISTS historique_stock (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          produit_id INTEGER NOT NULL,
          type TEXT NOT NULL, -- 'arrivage' ou 'retrait'
          quantite INTEGER NOT NULL,
          note TEXT,
          date TEXT DEFAULT (datetime('now')),
          FOREIGN KEY (produit_id) REFERENCES stock_equipements(id) ON DELETE CASCADE
        );`);
      },
      (err: any) => { console.error("Erreur SQL:", err); reject(err); },
      () => resolve()
    );
  });
};

export const initDatabase = async (): Promise<void> => {
  try {
    await creerTables();
    console.log('✅ Base de données prête');
  } catch (e) {
    console.error('❌ Erreur init:', e);
    throw e;
  }
};

export default getDatabase;
export const getDBConnection = async () => getDatabase();