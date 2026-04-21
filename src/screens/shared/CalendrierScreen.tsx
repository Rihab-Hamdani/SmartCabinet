import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, StatusBar, Alert
} from 'react-native';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { useFocusEffect, useRoute } from '@react-navigation/native';

// Import des services
import { 
  getRDVParDate, 
  getStatsRDVMois, 
  marquerPatientArrive, 
  modifierStatutRDV 
} from '../../database/rdvService';

// Configuration de la langue
LocaleConfig.locales['fr'] = {
  monthNames: ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'],
  monthNamesShort: ['Jan.','Fév.','Mar.','Avr.','Mai','Juin','Juil.','Août','Sept.','Oct.','Nov.','Déc.'],
  dayNames: ['Dimanche','Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi'],
  dayNamesShort: ['Dim.','Lun.','Mar.','Mer.','Jeu.','Ven.','Sam.'],
};
LocaleConfig.defaultLocale = 'fr';

export default function CalendrierRDV({ navigation }: any) {
  const route = useRoute<any>();
  const role = route?.params?.role ?? 'medecin';
  const isSecretaire = role === 'secretaire';

  const today = new Date().toISOString().split('T')[0];
  const [selected, setSelected] = useState(today);
  const [rdvDuJour, setRdvDuJour] = useState<any[]>([]);
  const [joursMarques, setJoursMarques] = useState<any>({});
  const [statsRDV, setStatsRDV] = useState<{ [key: string]: number }>({});

  const handleAjouterRDV = () => {
    if (!isSecretaire) return;
  
    Alert.alert(
      "Nouveau Rendez-vous",
      "Le patient est-il déjà enregistré ?",
      [
        {
          text: "Oui (Patient Existant)",
          onPress: () => {
            navigation.navigate('Patients', { screen: 'PatientsList' });
          }
        },
        {
          text: "Non (Nouveau)",
          onPress: () => navigation.navigate('AjouterPatient', { role })
        },
        { text: "Annuler", style: "cancel" }
      ]
    );
  };

  const chargerMois = useCallback(async (annee: number, mois: number) => {
    try {
      const stats = await getStatsRDVMois(annee, mois);
      const marques: any = {};
      const counts: any = {};

      stats.forEach((item: any) => {
        const nbPatients = Number(item.nb);
        marques[item.jour] = { 
          marked: true, 
          dotColor: nbPatients > 5 ? '#FF4757' : '#00BFA5' 
        };
        counts[item.jour] = nbPatients;
      });

      setJoursMarques(marques);
      setStatsRDV(counts);
    } catch (e) { console.error(e); }
  }, []);

  const chargerRDV = useCallback(async (date: string) => {
    try {
      const data = await getRDVParDate(date);
      setRdvDuJour(data);
    } catch (e) { console.error(e); }
  }, []);

  useFocusEffect(
    useCallback(() => {
      const d = new Date(selected);
      chargerMois(d.getFullYear(), d.getMonth() + 1);
      chargerRDV(selected);
    }, [selected, chargerMois, chargerRDV])
  );

  const onDayPress = (day: any) => {
    setSelected(day.dateString);
    chargerRDV(day.dateString);
  };

  const couleurStatut = (s: string) => {
    switch (s) {
      case 'confirmé': return '#00BFA5';
      case 'en attente': return '#FFA502';
      case 'annulé': return '#FF4757';
      case 'effectué': return '#45aaf2';
      default: return '#8B949E';
    }
  };

  const dateLabel = new Date(selected + 'T00:00:00').toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long',
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📅 Calendrier</Text>
        {isSecretaire && (
          <TouchableOpacity style={styles.addBtn} onPress={handleAjouterRDV}>
            <Text style={styles.addBtnTxt}>+ RDV</Text> 
          </TouchableOpacity>
        )}
      </View>

      <Calendar
        current={selected}
        onDayPress={onDayPress}
        onMonthChange={(m) => chargerMois(m.year, m.month)}
        markedDates={{
          ...joursMarques,
          [selected]: {
            ...(joursMarques[selected] || {}),
            selected: true,
            selectedColor: '#00BFA5',
          },
        }}
        renderArrow={(direction) => (
          <Text style={{ fontSize: 20, color: '#00BFA5' }}>
            {direction === 'left' ? '◀' : '▶'}
          </Text>
        )}
        theme={{
          calendarBackground: '#161B22',
          dayTextColor: '#E6EDF3',
          monthTextColor: '#E6EDF3',
          textDisabledColor: '#484F58',
          todayTextColor: '#00BFA5',
        }}
        style={styles.cal}
      />

      <View style={styles.infoBar}>
        <Text style={styles.dateLabelTxt}>{dateLabel}</Text>
        {statsRDV[selected] > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeTxt}>{statsRDV[selected]} Patient(s)</Text>
          </View>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.listContainer}>
        {rdvDuJour.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTxt}>Aucun rendez-vous pour cette date</Text>
          </View>
        ) : (
          rdvDuJour.map((rdv: any) => (
            <TouchableOpacity 
              key={rdv.id} 
              style={[styles.rdvCard, { borderLeftColor: couleurStatut(rdv.statut) }]}
              onPress={() => navigation.navigate('DetailPatient', { 
                patientId: rdv.patient_id, 
                patientNom: `${rdv.patient_prenom} ${rdv.patient_nom}` 
              })}
            >
              <View style={styles.rdvTime}>
                <Text style={styles.rdvHeureTxt}>{rdv.date_heure.split('T')[1].substring(0, 5)}</Text>
              </View>
              
              <View style={styles.rdvMainInfo}>
                <Text style={styles.rdvNomTxt}>{rdv.patient_prenom} {rdv.patient_nom}</Text>
                <Text style={styles.rdvMotifTxt}>{rdv.motif || 'Sans motif particulier'}</Text>
                <View style={[styles.statutPill, { backgroundColor: couleurStatut(rdv.statut) + '22' }]}>
                    <Text style={[styles.statutTxt, { color: couleurStatut(rdv.statut) }]}>{rdv.statut}</Text>
                </View>
              </View>

              <View style={styles.rdvActionArea}>
                {/* ACTIONS SECRETAIRE */}
                {isSecretaire && rdv.statut === 'confirmé' && (
                  <TouchableOpacity 
                    style={styles.actionBtnArrive}
                    onPress={async () => {
                      await marquerPatientArrive(rdv.id);
                      chargerRDV(selected);
                    }}>
                    <Text style={styles.actionBtnTxt}>Arrivé</Text>
                  </TouchableOpacity>
                )}

                {/* ACTIONS MÉDECIN */}
                {!isSecretaire && rdv.statut === 'en attente' && (
                  <View style={{ gap: 8 }}>
                    <TouchableOpacity 
                      style={styles.btnConsulter}
                      onPress={() => navigation.navigate('AjouterConsultation', { 
                        patientId: rdv.patient_id, 
                        patientNom: `${rdv.patient_nom} ${rdv.patient_prenom}` 
                      })}
                    >
                      <Text style={styles.btnText}>🩺 Consulter</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                      style={styles.actionBtnDone}
                      onPress={async () => {
                        await modifierStatutRDV(rdv.id, 'effectué');
                        chargerRDV(selected);
                      }}>
                      <Text style={styles.actionBtnTxt}>Terminer</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D1117' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 50, paddingBottom: 15, backgroundColor: '#161B22' },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#FFF' },
  addBtn: { backgroundColor: '#00BFA5', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  addBtnTxt: { color: '#000', fontWeight: 'bold', fontSize: 13 },
  cal: { borderBottomWidth: 1, borderBottomColor: '#30363D' },
  infoBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, backgroundColor: '#161B22' },
  dateLabelTxt: { color: '#E6EDF3', fontSize: 14, fontWeight: 'bold', textTransform: 'capitalize' },
  badge: { backgroundColor: '#00BFA5', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeTxt: { fontSize: 11, color: '#000', fontWeight: 'bold' },
  listContainer: { padding: 16, gap: 12 },
  rdvCard: { flexDirection: 'row', backgroundColor: '#161B22', borderRadius: 12, padding: 15, borderLeftWidth: 5, alignItems: 'center', marginBottom: 5 },
  rdvTime: { width: 60, borderRightWidth: 1, borderRightColor: '#30363D', marginRight: 15 },
  rdvHeureTxt: { color: '#00BFA5', fontWeight: 'bold', fontSize: 16 },
  rdvMainInfo: { flex: 1 },
  rdvNomTxt: { color: '#FFF', fontWeight: 'bold', fontSize: 16, marginBottom: 2 },
  rdvMotifTxt: { color: '#8B949E', fontSize: 13, marginBottom: 6 },
  statutPill: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statutTxt: { fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' },
  rdvActionArea: { marginLeft: 10, justifyContent: 'center' },
  actionBtnArrive: { backgroundColor: '#FFA502', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  actionBtnDone: { backgroundColor: '#00BFA5', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  actionBtnTxt: { color: '#000', fontWeight: 'bold', fontSize: 12 },
  btnConsulter: { backgroundColor: '#238636', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, alignItems: 'center' },
  btnText: { color: 'white', fontWeight: 'bold', fontSize: 12 },
  emptyState: { alignItems: 'center', marginTop: 40 },
  emptyTxt: { color: '#484F58', fontSize: 15 }
});