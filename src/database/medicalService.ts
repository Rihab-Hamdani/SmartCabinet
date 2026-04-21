import { executeQuery, executeInsert } from './database';

/**
 * --- GESTION DES CONSULTATIONS ---
 */

// Ajouter une nouvelle consultation avec le champ DIAGNOSTIC
export const ajouterConsultation = async (
  patientId: number, 
  dateCons: string, 
  symptomes: string, 
  remarques: string,
  diagnostic: string
): Promise<number> => {
  const sql = `
    INSERT INTO consultations (patient_id, date_cons, symptomes, remarques_medecin, diagnostic)
    VALUES (?, ?, ?, ?, ?);
  `;
  return await executeInsert(sql, [patientId, dateCons, symptomes, remarques, diagnostic]);
};

// Récupérer toutes les consultations simples d'un patient
export const getConsultationsParPatient = async (patientId: number) => {
  const sql = `
    SELECT * FROM consultations 
    WHERE patient_id = ? 
    ORDER BY date_cons DESC;
  `;
  return await executeQuery(sql, [patientId]);
};

/**
 * --- GESTION DES MÉDICAMENTS (ORDONNANCES) ---
 */

// Ajouter un médicament lié à une consultation
export const ajouterMedicamentOrdonnance = async (
  consultationId: number, 
  nom: string, 
  posologie: string
): Promise<number> => {
  const sql = `
    INSERT INTO ordonnances (consultation_id, nom_medicament, posologie)
    VALUES (?, ?, ?);
  `;
  return await executeInsert(sql, [consultationId, nom, posologie]);
};

// Récupérer les médicaments d'une consultation précise
export const getMedicamentsParConsultation = async (consultationId: number) => {
  const sql = `SELECT * FROM ordonnances WHERE consultation_id = ?`;
  return await executeQuery(sql, [consultationId]);
};

/**
 * --- RÉCUPÉRATION DU DOSSIER MÉDICAL COMPLET ---
 */

// Récupère les consultations avec la liste des médicaments groupés en une seule chaîne
export const getDossierMedicalFiltre = async (patientId: number): Promise<any[]> => {
  const sql = `
    SELECT 
      c.*, 
      GROUP_CONCAT(o.nom_medicament || ' (' || o.posologie || ')', '\n') as medicaments
    FROM consultations c
    LEFT JOIN ordonnances o ON c.id = o.consultation_id
    WHERE c.patient_id = ?
    GROUP BY c.id
    ORDER BY c.date_cons DESC;
  `;
  return await executeQuery(sql, [patientId]);
};