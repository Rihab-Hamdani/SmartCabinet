import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  Alert,
} from 'react-native';
import {
  useRoute,
  useFocusEffect,
  useNavigation,
} from '@react-navigation/native';

import {
  getPatientById,
  getConsultationsPatient,
  getRDVParPatient,
  updatePatientAntecedents,
} from '../../database/queries';

import { imprimerOrdonnancePDF } from '../../services/pdfService';

const DetailPatientScreen = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { patientId } = route.params;
  const role = route.params?.role || 'secretaire';
  const isMedecin = role === 'medecin';

  const [loading, setLoading] = useState(true);
  const [patient, setPatient] = useState<any>(null);
  const [consultations, setConsultations] = useState<any[]>([]);
  const [rdvHistory, setRdvHistory] = useState<any[]>([]);

  const chargerDonnees = useCallback(async () => {
    try {
      setLoading(true);
      const p = await getPatientById(patientId);
      setPatient(p);

      const rh = await getRDVParPatient(patientId);
      setRdvHistory(rh);

      if (isMedecin) {
        const c = await getConsultationsPatient(patientId);
        setConsultations(c);
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Erreur', 'Impossible de charger les données du patient.');
    } finally {
      setLoading(false);
    }
  }, [patientId, isMedecin]);

  useFocusEffect(
    useCallback(() => {
      chargerDonnees();
    }, [chargerDonnees]),
  );

  const editerAntecedents = () => {
    if (!isMedecin) return;
    Alert.prompt(
      'Modifier Antécédents',
      'Notes générales, allergies ou antécédents du patient :',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Enregistrer',
          onPress: async text => {
            try {
              await updatePatientAntecedents(patientId, text || '');
              chargerDonnees();
            } catch (e) {
              Alert.alert('Erreur', 'Mise à jour échouée.');
            }
          },
        },
      ],
      'plain-text',
      patient?.antecedents,
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#00BFA5" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <Text style={styles.backText}>← Retour</Text>
        </TouchableOpacity>
        <Text style={styles.patientName}>
          {patient?.prenom} {patient?.nom}
        </Text>
        <Text style={styles.patientSub}>
          {patient?.sexe === 'M' ? '♂️ Homme' : '♀️ Femme'} •{' '}
          {patient?.telephone || 'Pas de numéro'}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {isMedecin && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>📋 Antécédents & Notes</Text>
              <TouchableOpacity onPress={editerAntecedents}>
                <Text style={styles.editLink}>Modifier</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity onPress={editerAntecedents} activeOpacity={0.7}>
              <Text style={styles.antecedentsTxt}>
                {patient?.antecedents ||
                  'Cliquer ici pour ajouter des antécédents médicaux...'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {isMedecin && (
          <>
            <Text style={styles.sectionTitle}>📜 Consultations Passées</Text>
            {consultations.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyTxt}>Aucune visite enregistrée.</Text>
              </View>
            ) : (
              consultations.map(item => (
                /* 🔥 Rendu cliquable pour ouvrir l'écran de consultation de détail */
                <TouchableOpacity
                  key={item.id}
                  style={styles.consCard}
                  activeOpacity={0.8}
                  onPress={() =>
                    navigation.navigate('ConsultationDetail', {
                      consultation: item,
                      patient: patient,
                    })
                  }
                >
                  <View style={styles.consHeader}>
                    {/* 🔥 CORRIGÉ : On utilise date_cons au lieu de date */}
                    <Text style={styles.consDate}>
                      Visite du {item.date_cons}
                    </Text>
                    <TouchableOpacity
                      onPress={e => {
                        e.stopPropagation(); // Évite d'ouvrir l'écran de détail en cliquant sur le PDF
                        imprimerOrdonnancePDF(patient, item);
                      }}
                      style={styles.pdfBtn}
                    >
                      <Text style={styles.pdfBtnText}>🖨️ PDF</Text>
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.label}>Diagnostic :</Text>
                  <Text style={styles.valeur}>
                    {item.diagnostic || 'Non renseigné'}
                  </Text>

                  <Text style={styles.label}>Symptômes :</Text>
                  <Text style={styles.valeur}>{item.symptomes || 'N/A'}</Text>

                  {/* 🔥 CORRIGÉ : Ton champ en base de données s'appelle remarques_medecin (et non notes) */}
                  {item.remarques_medecin && (
                    <>
                      <Text style={styles.label}>Remarques :</Text>
                      <Text style={styles.valeur}>
                        {item.remarques_medecin}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              ))
            )}
          </>
        )}

        <Text style={styles.sectionTitle}>📅 Historique des RDV</Text>
        {rdvHistory.length === 0 ? (
          <Text style={[styles.emptyTxt, { marginLeft: 5 }]}>
            Aucun rendez-vous trouvé.
          </Text>
        ) : (
          rdvHistory.map(rdv => (
            <View key={rdv.id} style={styles.rdvItem}>
              <View style={styles.rdvRow}>
                <Text style={styles.rdvText}>
                  🗓️ {rdv.date_heure.replace('T', ' à ')}
                </Text>
                <View
                  style={[
                    styles.statusBadge,
                    {
                      backgroundColor:
                        rdv.statut === 'annulé' ? '#442726' : '#21332a',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      {
                        color: rdv.statut === 'annulé' ? '#ff6b6b' : '#7EE787',
                      },
                    ]}
                  >
                    {rdv.statut}
                  </Text>
                </View>
              </View>
              <Text style={styles.rdvMotif}>
                Motif : {rdv.motif || 'Non spécifié'}
              </Text>
            </View>
          ))
        )}
      </ScrollView>

      {isMedecin && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() =>
            navigation.navigate('AjouterConsultation', {
              patientId,
              patientNom: `${patient?.prenom} ${patient?.nom}`,
            })
          }
        >
          <Text style={styles.fabTxt}>+ Nouvelle Consultation</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D1117' },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0D1117',
  },
  backBtn: { marginBottom: 10 },
  backText: { color: '#00BFA5', fontWeight: 'bold' },
  header: {
    backgroundColor: '#161B22',
    padding: 20,
    paddingTop: 50,
    borderBottomWidth: 1,
    borderBottomColor: '#30363D',
  },
  patientName: { fontSize: 24, fontWeight: 'bold', color: '#FFF' },
  patientSub: { color: '#8B949E', marginTop: 4, fontSize: 14 },
  content: { padding: 20, paddingBottom: 120 },
  section: {
    backgroundColor: '#161B22',
    padding: 15,
    borderRadius: 12,
    marginBottom: 25,
    borderWidth: 1,
    borderColor: '#30363D',
  },
  sectionHeader: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    color: '#00BFA5',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 15,
    marginTop: 5,
  },
  editLink: { color: '#58A6FF', fontSize: 13, fontWeight: '600' },
  antecedentsTxt: { color: '#E6EDF3', fontStyle: 'italic', lineHeight: 20 },
  consCard: {
    backgroundColor: '#1C2128',
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#30363D',
  },
  consHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  consDate: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },
  pdfBtn: {
    backgroundColor: '#238636',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  pdfBtnText: { color: '#FFF', fontSize: 11, fontWeight: 'bold' },
  label: {
    color: '#8B949E',
    fontSize: 10,
    marginTop: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  valeur: { color: '#E6EDF3', fontSize: 15, marginTop: 3 },
  rdvItem: {
    backgroundColor: '#161B22',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#00BFA5',
  },
  rdvRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rdvText: { color: '#FFF', fontSize: 14, fontWeight: '500' },
  rdvMotif: { color: '#8B949E', fontSize: 12, marginTop: 5 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  statusText: { fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    backgroundColor: '#00BFA5',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 30,
    elevation: 8,
  },
  fabTxt: { color: '#000', fontWeight: 'bold', fontSize: 15 },
  emptyCard: {
    padding: 30,
    alignItems: 'center',
    backgroundColor: '#161B22',
    borderRadius: 12,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: '#30363D',
  },
  emptyTxt: { color: '#484F58', fontSize: 14 },
});

export default DetailPatientScreen;
