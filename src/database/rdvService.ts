import { executeQuery, executeInsert } from './database';
import { getDBConnection } from './database'; 
import getDatabase from './database'; 

export const updatePatientAntecedents = async (id: number, text: string) => {
  const db = await getDatabase();
  return new Promise((resolve, reject) => {
    db.transaction((tx: any) => {
      tx.executeSql(
        'UPDATE patients SET antecedents = ? WHERE id = ?',
        [text, id],
        () => resolve(true),
        (_: any, err: any) => reject(err)
      );
    });
  });
};

export interface Patient {
  id: number;
  nom: string;
  prenom: string;
  cin?: string;
  date_naissance?: string;
  sexe?: 'M' | 'F';
  telephone?: string;
  email?: string;
  antecedents?: string;
  created_at?: string;
}



export interface RendezVous {
  id: number;
  patient_id: number;
  date_heure: string;      // format ISO : "2025-04-11T09:30:00"
  motif?: string;
  statut: 'confirmé' | 'annulé' | 'effectué' | 'en attente';
  // jointure
  patient_nom?: string;
  patient_prenom?: string;
  patient_sexe?: string;
}

// ── MIGRATION ──────────────────────────────────────────────────

export const migrateRdvTables = async (): Promise<void> => {
  await executeQuery(`DROP TABLE IF EXISTS ordonnances;`);
  await executeQuery(`DROP TABLE IF EXISTS consultations;`);
  // Table patients
  await executeQuery(`
    CREATE TABLE IF NOT EXISTS patients (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      nom            TEXT NOT NULL,
      prenom         TEXT NOT NULL,
      cin            TEXT,
      date_naissance TEXT,
      sexe           TEXT DEFAULT 'M',
      telephone      TEXT,
      email          TEXT,
      antecedents    TEXT,
      created_at     TEXT DEFAULT (datetime('now'))
    );
  `);

  //table ordonnances
  await executeQuery(`
  CREATE TABLE IF NOT EXISTS ordonnances (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    consultation_id INTEGER NOT NULL,
    nom_medicament TEXT NOT NULL,  -- Vérifie bien ce nom
    posologie TEXT,
    remarques_medicament TEXT,
    FOREIGN KEY (consultation_id) REFERENCES consultations(id) ON DELETE CASCADE
  );
`);

  // Table rendez_vous
  await executeQuery(`
    CREATE TABLE IF NOT EXISTS rendez_vous (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id INTEGER NOT NULL,
      date_heure TEXT NOT NULL,
      motif      TEXT,
      statut     TEXT DEFAULT 'confirmé',
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
    );
  `);

};

// Récupérer les médicaments d'une consultation spécifique
export const getMedicamentsParConsultation = async (consultationId: number): Promise<any[]> => {
  const db = await getDBConnection();

  const query = `SELECT * FROM medicaments_prescrits WHERE consultation_id = ?`;
  
  try {
    const results = await db.executeSql(query, [consultationId]);
    const meds: any[] = [];
    results.forEach(result => {
      for (let i = 0; i < result.rows.length; i++) {
        meds.push(result.rows.item(i));
      }
    });
    return meds;
  } catch (error) {
    console.error("Erreur SQL getMedicamentsParConsultation:", error);
    return [];
  }
};

// ── PATIENTS CRUD ──────────────────────────────────────────────

export const getAllPatients = (): Promise<Patient[]> =>
  executeQuery(`
    SELECT * FROM patients ORDER BY nom ASC, prenom ASC;
  `);

export const getPatientById = async (id: number): Promise<Patient | null> => {
  const rows = await executeQuery(
    'SELECT * FROM patients WHERE id = ?;', [id]
  );
  return rows[0] ?? null;
};

export const rechercherPatients = (terme: string): Promise<Patient[]> =>
  executeQuery(`
    SELECT * FROM patients
    WHERE nom LIKE ? OR prenom LIKE ? OR cin LIKE ?
    ORDER BY nom ASC;
  `, [`%${terme}%`, `%${terme}%`, `%${terme}%`]);

export const ajouterPatient = async (p: Omit<Patient, 'id' | 'created_at'>): Promise<number> => {
  // Valider CIN si fourni
  if (p.cin && p.cin.trim() !== '') {
    if (!/^\d{8}$/.test(p.cin.trim())) {
      throw new Error('Le CIN doit contenir exactement 8 chiffres.');
    }
  }
  return await executeInsert(`
    INSERT INTO patients (nom, prenom, cin, date_naissance, sexe, telephone, email, antecedents)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?);
  `, [
    p.nom.trim(),
    p.prenom.trim(),
    p.cin?.trim() ?? null,
    p.date_naissance ?? null,
    p.sexe ?? 'M',
    p.telephone?.trim() ?? null,
    p.email?.trim() ?? null,
    p.antecedents?.trim() ?? null,
  ]);
};

export const modifierPatient = async (id: number, p: Omit<Patient, 'id' | 'created_at'>): Promise<void> => {
  if (p.cin && p.cin.trim() !== '') {
    if (!/^\d{8}$/.test(p.cin.trim())) {
      throw new Error('Le CIN doit contenir exactement 8 chiffres.');
    }
  }
  await executeInsert(`
    UPDATE patients
    SET nom=?, prenom=?, cin=?, date_naissance=?, sexe=?, telephone=?, email=?, antecedents=?
    WHERE id=?;
  `, [
    p.nom.trim(),
    p.prenom.trim(),
    p.cin?.trim() ?? null,
    p.date_naissance ?? null,
    p.sexe ?? 'M',
    p.telephone?.trim() ?? null,
    p.email?.trim() ?? null,
    p.antecedents?.trim() ?? null,
    id,
  ]);
};

export const supprimerPatient = async (id: number): Promise<void> => {
  await executeInsert('DELETE FROM patients WHERE id = ?;', [id]);
};



// ── RENDEZ-VOUS CRUD ───────────────────────────────────────────

export const getRDVDuJour = (): Promise<RendezVous[]> => {
  const aujourdhui = new Date().toISOString().split('T')[0];
  return executeQuery(`
    SELECT r.*, p.nom as patient_nom, p.prenom as patient_prenom, p.sexe as patient_sexe
    FROM rendez_vous r
    JOIN patients p ON r.patient_id = p.id
    WHERE r.date_heure LIKE ? AND r.statut != 'annulé'
    ORDER BY r.date_heure ASC;
  `, [`${aujourdhui}%`]);
};

export const getRDVParPatient = async (patientId: number): Promise<any[]> => {
  return await executeQuery(
    `SELECT * FROM rendez_vous WHERE patient_id = ? ORDER BY date_heure DESC`,
    [patientId]
  );
}; 

export const getRDVParDate = (date: string): Promise<RendezVous[]> =>
  executeQuery(`
    SELECT r.*, p.nom as patient_nom, p.prenom as patient_prenom, p.sexe as patient_sexe
    FROM rendez_vous r
    JOIN patients p ON r.patient_id = p.id
    WHERE r.date_heure LIKE ?
    ORDER BY r.date_heure ASC;
  `, [`${date}%`]);

export const getRDVParMois = (annee: number, mois: number): Promise<RendezVous[]> => {
  const prefix = `${annee}-${String(mois).padStart(2, '0')}`;
  return executeQuery(`
    SELECT r.*, p.nom as patient_nom, p.prenom as patient_prenom
    FROM rendez_vous r
    JOIN patients p ON r.patient_id = p.id
    WHERE r.date_heure LIKE ? AND r.statut != 'annulé'
    ORDER BY r.date_heure ASC;
  `, [`${prefix}%`]);
};

export const getJoursAvecRDV = async (annee: number, mois: number): Promise<string[]> => {
  const prefix = `${annee}-${String(mois).padStart(2, '0')}`;
  const rows = await executeQuery(`
    SELECT DISTINCT substr(date_heure, 1, 10) as jour
    FROM rendez_vous
    WHERE date_heure LIKE ? AND statut != 'annulé';
  `, [`${prefix}%`]);
  return rows.map((r: any) => r.jour);
};

export const getRDVPatient = (patientId: number): Promise<RendezVous[]> =>
  executeQuery(`
    SELECT * FROM rendez_vous
    WHERE patient_id = ?
    ORDER BY date_heure DESC;
  `, [patientId]);

export const ajouterRDV = async (rdv: {
  patient_id: number;
  date_heure: string;
  motif?: string;
  statut?: RendezVous['statut'];
}): Promise<number> => {
  // Vérifier qu'il n'y a pas déjà un RDV au même créneau
  const conflit = await executeQuery(
    'SELECT id FROM rendez_vous WHERE date_heure = ? AND statut != ?;',
    [rdv.date_heure, 'annulé']
  );
  if (conflit.length > 0) {
    throw new Error('Ce créneau est déjà pris. Choisissez un autre horaire.');
  }
  return executeInsert(`
    INSERT INTO rendez_vous (patient_id, date_heure, motif, statut)
    VALUES (?, ?, ?, ?);
  `, [
    rdv.patient_id,
    rdv.date_heure,
    rdv.motif?.trim() ?? '',
    rdv.statut ?? 'confirmé',
  ]);
};

export const modifierStatutRDV = async (
  id: number,
  statut: RendezVous['statut']
): Promise<void> => {
  await executeInsert(
    'UPDATE rendez_vous SET statut = ? WHERE id = ?;',
    [statut, id]
  );
};

export const supprimerRDV = async (id: number): Promise<void> => {
  await executeInsert('DELETE FROM rendez_vous WHERE id = ?;', [id]);
};

export const countRDVDuJour = async (): Promise<number> => {
  const aujourdhui = new Date().toISOString().split('T')[0];
  const rows = await executeQuery(`
    SELECT COUNT(*) as count FROM rendez_vous
    WHERE date_heure LIKE ? AND statut != 'annulé';
  `, [`${aujourdhui}%`]);
  return rows[0]?.count ?? 0;
};

export const getHistoriqueRDV = async (patientId: number): Promise<any[]> => {
  return await executeQuery(
    `SELECT * FROM rendez_vous 
     WHERE patient_id = ? 
     ORDER BY date_heure DESC`, 
    [patientId]
  );
};

export const getRDVByPatient = async (patientId: number): Promise<any[]> => {
  return await executeQuery(`
    SELECT * FROM rendez_vous 
    WHERE patient_id = ? 
    ORDER BY date_heure DESC;
  `, [patientId]);
};

/**
 * Récupère le nombre de RDV par jour pour un mois donné
 des compteurs sur le calendrier
 */
 export const getStatsRDVMois = async (annee: number, mois: number): Promise<any[]> => {
  const prefix = `${annee}-${String(mois).padStart(2, '0')}`;
  return await executeQuery(`
    SELECT substr(date_heure, 1, 10) as jour, COUNT(*) as nb
    FROM rendez_vous
    WHERE date_heure LIKE ? AND statut != 'annulé'
    GROUP BY jour;
  `, [`${prefix}%`]);
};

/**
 * Marque un patient comme "Arrivé" en changeant son statut en "en attente"
 * (Statut utilisé par le médecin pour savoir qui est en salle d'attente)
 */
export const marquerPatientArrive = async (rdvId: number): Promise<void> => {
  await executeInsert(
    "UPDATE rendez_vous SET statut = 'en attente' WHERE id = ?;",
    [rdvId]
  );
};

// Interface pour un médicament dans l'ordonnance
export interface MedicamentPrescrit {
  nom_medicament: string;
  posologie: string;
  remarques_medicament: string;
}

// Fonction pour enregistrer une consultation complète
export const enregistrerConsultation = async (
  patientId: number,
  symptomes: string,
  remarques: string,
  medicaments: MedicamentPrescrit[]
) => {
  const dateNow = new Date().toISOString();

  try {
    // 1. Insertion de la consultation via executeInsert pour récupérer l'ID
    const consultationId = await executeInsert(
      `INSERT INTO consultations (patient_id, date_cons, symptomes, remarques_medecin) 
       VALUES (?, ?, ?, ?);`,
      [patientId, dateNow, symptomes, remarques]
    );

    // 2. Insertion de tous les médicaments liés
    for (const med of medicaments) {
      await executeInsert(
        `INSERT INTO ordonnances (consultation_id, nom_medicament, posologie, remarques_medicament) 
         VALUES (?, ?, ?, ?);`,
        [consultationId, med.nom_medicament, med.posologie, med.remarques_medicament]
      );
    }

    return consultationId; 
  } catch (error) {
    console.error("Erreur enregistrement consultation:", error);
    throw new Error("Échec de l'enregistrement de la consultation");
  }
};

export const getConsultationsByPatient = async (patientId: number): Promise<any[]> => {
  return await executeQuery(`
    SELECT c.*, group_concat(o.nom_medicament || ' (' || o.posologie || ')') as liste_meds
    FROM consultations c
    LEFT JOIN ordonnances o ON c.id = o.consultation_id
    WHERE c.patient_id = ?
    GROUP BY c.id
    ORDER BY c.date_cons DESC;
  `, [patientId]);
};

export const getHistoriqueConsultations = async (patientId: number): Promise<any[]> => {
  const db = await getDatabase();
  return new Promise((resolve, reject) => {
    db.transaction((tx: any) => {
      tx.executeSql(
        'SELECT * FROM consultations WHERE patient_id = ? ORDER BY date_cons DESC',
        [patientId],
        (_: any, results: any) => {
          const rows = [];
          for (let i = 0; i < results.rows.length; i++) {
            rows.push(results.rows.item(i));
          }
          resolve(rows);
        },
        (_: any, err: any) => reject(err)
      );
    });
  });
};