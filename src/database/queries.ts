import { executeQuery, executeInsert } from './database';

// ─── TYPES ────────────────────────────────────────────────────
export interface User {
  id: number;
  role: 'medecin' | 'secretaire';
  nom: string;
  prenom: string;
  email: string;
  password: string;
  sexe: string;
  biometrie_active: number;
  created_at?: string;
}

export interface Patient {
  id: number;
  nom: string;
  prenom: string;
  cin?: string;
  date_naissance?: string;
  sexe?: string;
  telephone?: string;
  email?: string;
  antecedents?: string;
  created_at?: string;
}

export interface RendezVous {
  id: number;
  patient_id: number;
  date_heure: string;
  motif?: string;
  statut: string;
  nom?: string;
  prenom?: string;
}

export interface StockItem {
  id: number;
  nom: string;
  quantite: number;
  seuil_alerte: number;
  unite: string;
}

export interface Consultation {
  id: number;
  patient_id: number;
  date: string;
  tension?: string;
  poids?: string;
  temperature?: string;
  symptomes?: string;
  diagnostic?: string;
  decision_finale?: string;
  notes?: string;
}

// ─── AUTH ──────────────────────────────────────────────────────

// Vérifier si un email existe déjà
export const emailExiste = async (email: string): Promise<boolean> => {
  const rows = await executeQuery(
    'SELECT id FROM users WHERE email = ?;',
    [email.toLowerCase().trim()]
  );
  return rows.length > 0;
};

// Créer un nouveau compte
export const creerCompte = async (user: {
  role: 'medecin' | 'secretaire';
  nom: string;
  prenom: string;
  email: string;
  password: string;
  sexe?: string;
}, skipEmailCheck = false): Promise<number> => {
  
  if (!skipEmailCheck) {
    const existe = await emailExiste(user.email);
    if (existe) throw new Error('Cet email est déjà utilisé.');
  }

  return await executeInsert(
    `INSERT OR REPLACE INTO users (role, nom, prenom, email, password, sexe)
     VALUES (?, ?, ?, ?, ?, ?);`,
    [
      user.role,
      user.nom.trim(),
      user.prenom.trim(),
      user.email.toLowerCase().trim(),
      user.password,
      user.sexe ?? 'M',
    ]
  );
};

// Connexion par email + mot de passe
export const connecterParMotDePasse = async (
  email: string,
  password: string
): Promise<User | null> => {
  console.log('🔍 Recherche DB:', email, '/', password);
  const rows = await executeQuery(
    'SELECT * FROM users WHERE LOWER(TRIM(email)) = LOWER(TRIM(?)) AND password = ?;',
    [email, password]
  );
  console.log('🔍 Résultat DB:', rows.length, 'ligne(s)');
  if (rows.length > 0) console.log('🔍 User:', JSON.stringify(rows[0]));
  return rows.length > 0 ? (rows[0] as User) : null;
};

// Récupérer un user par email
export const getUserParEmail = async (
  email: string
): Promise<User | null> => {
  const rows = await executeQuery(
    'SELECT * FROM users WHERE LOWER(TRIM(email)) = LOWER(TRIM(?));',
    [email]
  );
  console.log('🔍 getUserParEmail:', email, '→', rows.length, 'résultat(s)');
  return rows.length > 0 ? (rows[0] as User) : null;
};

// Récupérer un user par role 
export const getUserParRole = async (
  role: 'medecin' | 'secretaire'
): Promise<User | null> => {
  const rows = await executeQuery(
    'SELECT * FROM users WHERE role = ?;',
    [role]
  );
  return rows.length > 0 ? (rows[0] as User) : null;
};

export const mettreAJourMotDePasse = async (
  email: string,
  newPassword: string
): Promise<void> => {
  await executeInsert(
    'UPDATE users SET password = ? WHERE LOWER(TRIM(email)) = LOWER(TRIM(?));',
    [newPassword, email]
  );
  console.log('✅ MDP mis à jour dans SQLite pour:', email);
};

// Vérifier si un rôle a un compte
export const compteExistePourRole = async (
  role: 'medecin' | 'secretaire'
): Promise<boolean> => {
  const rows = await executeQuery(
    'SELECT id FROM users WHERE role = ?;',
    [role]
  );
  return rows.length > 0;
};

// Vérifier si au moins un compte existe
export const aucunCompteExiste = async (): Promise<boolean> => {
  const rows = await executeQuery('SELECT COUNT(*) as count FROM users;');
  return rows[0]?.count === 0;
};


// ─── PATIENTS ──────────────────────────────────────────────────
export const getTousPatients = async (): Promise<Patient[]> => {
  return await executeQuery('SELECT * FROM patients ORDER BY nom, prenom;');
};

export const getPatientById = async (id: number): Promise<Patient | undefined> => {
  const rows = await executeQuery('SELECT * FROM patients WHERE id = ?;', [id]);
  return rows[0];
};

export const ajouterPatient = async (
  patient: Omit<Patient, 'id' | 'created_at'>
): Promise<number> => {
  return await executeInsert(
    `INSERT INTO patients (nom, prenom, cin, date_naissance, sexe, telephone, email, antecedents)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
    [
      patient.nom, patient.prenom, patient.cin ?? '',
      patient.date_naissance ?? '', patient.sexe ?? '',
      patient.telephone ?? '', patient.email ?? '',
      patient.antecedents ?? '',
    ]
  );
};

export const modifierPatient = async (
  id: number,
  patient: Omit<Patient, 'id' | 'created_at'>
): Promise<void> => {
  await executeInsert(
    `UPDATE patients SET nom=?, prenom=?, cin=?, date_naissance=?,
     sexe=?, telephone=?, email=?, antecedents=? WHERE id=?;`,
    [
      patient.nom, patient.prenom, patient.cin ?? '',
      patient.date_naissance ?? '', patient.sexe ?? '',
      patient.telephone ?? '', patient.email ?? '',
      patient.antecedents ?? '', id,
    ]
  );
};

export const rechercherPatients = async (terme: string): Promise<Patient[]> => {
  return await executeQuery(
    `SELECT * FROM patients
     WHERE nom LIKE ? OR prenom LIKE ? OR cin LIKE ?
     ORDER BY nom, prenom;`,
    [`%${terme}%`, `%${terme}%`, `%${terme}%`]
  );
};

// ─── RENDEZ-VOUS ───────────────────────────────────────────────
export const getRDVDuJour = async (): Promise<RendezVous[]> => {
  const aujourdhui = new Date().toISOString().split('T')[0];
  return await executeQuery(
    `SELECT r.*, p.nom, p.prenom FROM rendez_vous r
     JOIN patients p ON r.patient_id = p.id
     WHERE r.date_heure LIKE ? AND r.statut != 'annulé'
     ORDER BY r.date_heure;`,
    [`${aujourdhui}%`]
  );
};
// Nouveau : Pour voir tous les RDV passés du patient
export const getRDVParPatient = async (patientId: number): Promise<RendezVous[]> => {
  return await executeQuery(
    `SELECT * FROM rendez_vous WHERE patient_id = ? ORDER BY date_heure DESC;`,
    [patientId]
  );
};
export const getRDVParDate = async (date: string): Promise<RendezVous[]> => {
  return await executeQuery(
    `SELECT r.*, p.nom, p.prenom FROM rendez_vous r
     JOIN patients p ON r.patient_id = p.id
     WHERE r.date_heure LIKE ? ORDER BY r.date_heure;`,
    [`${date}%`]
  );
};

export const getJoursAvecRDV = async (moisAnnee: string): Promise<string[]> => {
  const rows = await executeQuery(
    `SELECT DISTINCT substr(date_heure,1,10) as jour FROM rendez_vous
     WHERE date_heure LIKE ? AND statut != 'annulé';`,
    [`${moisAnnee}%`]
  );
  return rows.map((r: any) => r.jour);
};

export const ajouterRDV = async (rdv: {
  patient_id: number; date_heure: string;
  motif?: string; statut?: string;
}): Promise<number> => {
  return await executeInsert(
    'INSERT INTO rendez_vous (patient_id, date_heure, motif, statut) VALUES (?, ?, ?, ?);',
    [rdv.patient_id, rdv.date_heure, rdv.motif ?? '', rdv.statut ?? 'confirmé']
  );
};

export const modifierRDV = async (id: number, rdv: {
  date_heure?: string; motif?: string; statut?: string;
}): Promise<void> => {
  await executeInsert(
    'UPDATE rendez_vous SET date_heure=?, motif=?, statut=? WHERE id=?;',
    [rdv.date_heure, rdv.motif ?? '', rdv.statut ?? 'confirmé', id]
  );
};

export const annulerRDV = async (id: number): Promise<void> => {
  await executeInsert(
    "UPDATE rendez_vous SET statut='annulé' WHERE id=?;", [id]
  );
};

// ─── STOCK ─────────────────────────────────────────────────────
export const getStock = async (): Promise<StockItem[]> => {
  return await executeQuery('SELECT * FROM stock_equipements ORDER BY nom;');
};

export const getStockAlertes = async (): Promise<StockItem[]> => {
  return await executeQuery(
    'SELECT * FROM stock_equipements WHERE quantite <= seuil_alerte ORDER BY quantite;'
  );
};

export const ajouterStock = async (item: Omit<StockItem, 'id'>): Promise<number> => {
  return await executeInsert(
    'INSERT INTO stock_equipements (nom, quantite, seuil_alerte, unite) VALUES (?, ?, ?, ?);',
    [item.nom, item.quantite, item.seuil_alerte, item.unite]
  );
};

export const modifierStock = async (id: number, item: Omit<StockItem, 'id'>): Promise<void> => {
  await executeInsert(
    `UPDATE stock_equipements
     SET nom=?, quantite=?, seuil_alerte=?, unite=?, updated_at=datetime('now')
     WHERE id=?;`,
    [item.nom, item.quantite, item.seuil_alerte, item.unite, id]
  );
};

export const supprimerStock = async (id: number): Promise<void> => {
  await executeInsert('DELETE FROM stock_equipements WHERE id=?;', [id]);
};

// ─── CONSULTATIONS ─────────────────────────────────────────────
export const ajouterConsultation = async (c: {
  patient_id: number; date: string; tension?: string;
  poids?: string; temperature?: string; symptomes?: string;
  diagnostic?: string; decision_finale?: string; notes?: string;
}): Promise<number> => {
  return await executeInsert(
    `INSERT INTO consultations
     (patient_id, date, tension, poids, temperature, symptomes, diagnostic, decision_finale, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    [
      c.patient_id, c.date, c.tension ?? '', c.poids ?? '',
      c.temperature ?? '', c.symptomes ?? '', c.diagnostic ?? '',
      c.decision_finale ?? '', c.notes ?? '',
    ]
  );
};

export const getConsultationsPatient = async (patient_id: number): Promise<Consultation[]> => {
  return await executeQuery(
    'SELECT * FROM consultations WHERE patient_id = ? ORDER BY date DESC;',
    [patient_id]
  );
};

// Nouveau : Récupérer une consultation précise (Correction du rouge)
export const getConsultationById = async (id: number): Promise<Consultation | undefined> => {
  const rows = await executeQuery('SELECT * FROM consultations WHERE id = ?;', [id]);
  return rows[0] as Consultation | undefined; // On ajoute "as ..." pour aider TypeScript
};

// ─── ORDONNANCES ───────────────────────────────────────────────
export const ajouterOrdonnance = async (o: {
  consultation_id: number; patient_id: number;
  pdf_path: string; date: string; envoye_via?: string;
}): Promise<number> => {
  return await executeInsert(
    `INSERT INTO ordonnances (consultation_id, patient_id, pdf_path, date, envoye_via)
     VALUES (?, ?, ?, ?, ?);`,
    [o.consultation_id, o.patient_id, o.pdf_path, o.date, o.envoye_via ?? '']
  );
};

export const ajouterMedicament = async (m: {
  ordonnance_id: number; nom: string;
  dosage?: string; frequence?: string; duree?: string;
}): Promise<void> => {
  await executeInsert(
    'INSERT INTO medicaments (ordonnance_id, nom, dosage, frequence, duree) VALUES (?, ?, ?, ?, ?);',
    [m.ordonnance_id, m.nom, m.dosage ?? '', m.frequence ?? '', m.duree ?? '']
  );
};

export const getOrdonnancesPatient = async (patient_id: number): Promise<any[]> => {
  return await executeQuery(
    `SELECT o.*, c.diagnostic FROM ordonnances o
     LEFT JOIN consultations c ON o.consultation_id = c.id
     WHERE o.patient_id = ? ORDER BY o.date DESC;`,
    [patient_id]
  );
};

export const getMedicamentsOrdonnance = async (ordonnance_id: number): Promise<any[]> => {
  return await executeQuery(
    'SELECT * FROM medicaments WHERE ordonnance_id = ?;', [ordonnance_id]
  );
};



// ─── ANALYSES ──────────────────────────────────────────────────
export const ajouterAnalyse = async (a: {
  patient_id: number; date: string;
  image_path: string; texte_ocr?: string;
}): Promise<number> => {
  return await executeInsert(
    'INSERT INTO analyses (patient_id, date, image_path, texte_ocr) VALUES (?, ?, ?, ?);',
    [a.patient_id, a.date, a.image_path, a.texte_ocr ?? null]
  );
};

export const getAnalysesPatient = async (patient_id: number): Promise<any[]> => {
  return await executeQuery(
    'SELECT * FROM analyses WHERE patient_id = ? ORDER BY date DESC;',
    [patient_id]
  );
};

// Mettre à jour uniquement les antécédents d'un patient
export const updatePatientAntecedents = async (id: number, texte: string): Promise<void> => {
  await executeInsert(
    'UPDATE patients SET antecedents = ? WHERE id = ?;',
    [texte, id]
  );
};