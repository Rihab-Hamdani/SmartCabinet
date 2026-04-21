import { executeQuery, executeInsert } from './database';


// ── Types ──────────────────────────────────────────────────────
export interface StockItem {
  id: number;
  nom: string;
  categorie?: string;       // pas dans la table originale, on le gère en JS
  quantite: number;
  unite: string;
  seuil_alerte: number;
  description?: string;     // pas dans la table originale
  updated_at: string;
}

export type StockFormData = {
  nom: string;
  quantite: number;
  unite: string;
  seuil_alerte: number;
};

export interface RetirerResult {
  newQuantite: number;
  enAlerte: boolean;
}

export interface ArrivageResult {
  newQuantite: number;
}

// ── Ajouter la colonne 'categorie' si elle n'existe pas (migration) ──
export const migrateStockTable = async (): Promise<void> => {
  try {
    await executeQuery(
      `ALTER TABLE stock_equipements ADD COLUMN categorie TEXT DEFAULT 'Général';`
    );
  } catch {
    // La colonne existe déjà — pas grave
  }
  try {
    await executeQuery(
      `ALTER TABLE stock_equipements ADD COLUMN description TEXT DEFAULT '';`
    );
  } catch {
    // idem
  }
};

// ── CRUD ───────────────────────────────────────────────────────

export const getAllStock = (): Promise<StockItem[]> =>
  executeQuery('SELECT * FROM stock_equipements ORDER BY nom ASC;');

export const getStockAlertes = (): Promise<StockItem[]> =>
  executeQuery(
    'SELECT * FROM stock_equipements WHERE quantite <= seuil_alerte ORDER BY quantite ASC;'
  );

export const getStockById = async (id: number): Promise<StockItem | null> => {
  const rows = await executeQuery(
    'SELECT * FROM stock_equipements WHERE id = ?;', [id]
  );
  return rows[0] ?? null;
};

export const addStock = (data: StockFormData): Promise<number> =>
  executeInsert(
    `INSERT INTO stock_equipements (nom, quantite, unite, seuil_alerte, updated_at)
     VALUES (?, ?, ?, ?, datetime('now'));`,
    [data.nom.trim(), data.quantite, data.unite, data.seuil_alerte]
  );

export const updateStock = (id: number, data: StockFormData): Promise<number> =>
  executeInsert(
    `UPDATE stock_equipements
     SET nom = ?, quantite = ?, unite = ?, seuil_alerte = ?, updated_at = datetime('now')
     WHERE id = ?;`,
    [data.nom.trim(), data.quantite, data.unite, data.seuil_alerte, id]
  );

export const deleteStock = (id: number): Promise<number> =>
  executeInsert('DELETE FROM stock_equipements WHERE id = ?;', [id]);

export const retirerQuantite = async (
  id: number,
  quantiteARetirer: number
): Promise<RetirerResult> => {
  const rows = await executeQuery(
    'SELECT quantite, seuil_alerte FROM stock_equipements WHERE id = ?;', [id]
  );
  if (!rows[0]) throw new Error('Produit introuvable');

  const { quantite, seuil_alerte } = rows[0] as { quantite: number; seuil_alerte: number };
  if (quantiteARetirer > quantite) {
    throw new Error(`Stock insuffisant. Disponible : ${quantite}`);
  }

  const newQuantite = quantite - quantiteARetirer;
  await executeInsert(
    `UPDATE stock_equipements SET quantite = ?, updated_at = datetime('now') WHERE id = ?;`,
    [newQuantite, id]
  );
  return { newQuantite, enAlerte: newQuantite <= seuil_alerte };
};

export const arrivageStock = async (
  id: number,
  quantiteAjoutee: number
): Promise<ArrivageResult> => {
  const rows = await executeQuery(
    'SELECT quantite FROM stock_equipements WHERE id = ?;', [id]
  );
  if (!rows[0]) throw new Error('Produit introuvable');

  const newQuantite = (rows[0] as { quantite: number }).quantite + quantiteAjoutee;
  await executeInsert(
    `UPDATE stock_equipements SET quantite = ?, updated_at = datetime('now') WHERE id = ?;`,
    [newQuantite, id]
  );
  return { newQuantite };
};

export const countAlertes = async (): Promise<number> => {
  const rows = await executeQuery(
    'SELECT COUNT(*) as count FROM stock_equipements WHERE quantite <= seuil_alerte;'
  );
  return (rows[0] as { count: number })?.count ?? 0;
};

//enregistrement d'ajout d'un produit 
export const ajouterHistorique = (
  produitId: number,
  type: 'arrivage' | 'retrait',
  quantite: number,
  note?: string
): Promise<number> =>
  executeInsert(
    `INSERT INTO historique_stock (produit_id, type, quantite, note)
     VALUES (?, ?, ?, ?);`,
    [produitId, type, quantite, note ?? '']
  );

// Récupérer l'historique d'un produit
export const getHistoriqueProduit = (produitId: number) =>
  executeQuery(
    `SELECT * FROM historique_stock WHERE produit_id = ? ORDER BY date DESC;`,
    [produitId]
  );