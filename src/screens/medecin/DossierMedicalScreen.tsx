import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView } from 'react-native';
import { getConsultationsParPatient } from '../../database/medicalService';

const DossierMedicalScreen = ({ route, navigation }: any) => {
  const { patient } = route.params; 
  const [consultations, setConsultations] = useState([]);

  useEffect(() => {
    const chargerHistorique = async () => {
      const data = await getConsultationsParPatient(patient.id);
      setConsultations(data);
    };
    chargerHistorique();
  }, [patient.id]);

  const renderConsultationItem = ({ item }: any) => (
    <TouchableOpacity 
      style={styles.consultationCard}
      onPress={() => navigation.navigate('ConsultationDetail', { consultation: item, patient })}
    >
      <View style={styles.dateBadge}>
        <Text style={styles.calendarIcon}>📅</Text>
        <Text style={styles.dateText}>{item.date_cons}</Text>
      </View>
      <View style={styles.previewContent}>
        <Text style={styles.symptomePreview} numberOfLines={1}>
          {item.symptomes || "Pas de symptômes saisis"}
        </Text>
        <Text style={styles.clickInfo}>Voir détails et ordonnance {'>'}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerCard}>
        <Text style={styles.patientName}>{patient.prenom} {patient.nom}</Text>
        <Text style={styles.patientSub}>{patient.telephone} • {patient.cin}</Text>
        <View style={styles.divider} />
        <Text style={styles.sectionTitle}>📋 Antécédents Permanents</Text>
        <View style={styles.antecedentBubble}>
          <Text style={styles.antecedentText}>
            {patient.antecedents || "Aucun antécédent enregistré."}
          </Text>
        </View>
      </View>

      <View style={styles.listContainer}>
        <Text style={styles.listTitle}>Historique des visites</Text>
        <FlatList
          data={consultations}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderConsultationItem}
          ListEmptyComponent={<Text style={styles.emptyText}>Aucune consultation passée.</Text>}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F2F5' },
  headerCard: { backgroundColor: '#00BFA5', padding: 20, borderBottomLeftRadius: 25, borderBottomRightRadius: 25, elevation: 5 },
  patientName: { fontSize: 22, fontWeight: 'bold', color: '#FFF' },
  patientSub: { fontSize: 14, color: '#E0F2F1', marginTop: 5 },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.3)', marginVertical: 15 },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#FFF', marginBottom: 8 },
  antecedentBubble: { backgroundColor: 'rgba(255,255,255,0.2)', padding: 12, borderRadius: 10 },
  antecedentText: { fontSize: 15, color: '#FFF', fontStyle: 'italic' },
  listContainer: { flex: 1, paddingHorizontal: 15, marginTop: 10 },
  listTitle: { fontSize: 18, fontWeight: 'bold', color: '#34495E', marginVertical: 15 },
  consultationCard: { backgroundColor: '#FFF', borderRadius: 12, padding: 15, flexDirection: 'row', alignItems: 'center', marginBottom: 12, elevation: 2 },
  dateBadge: { alignItems: 'center', borderRightWidth: 1, borderRightColor: '#EEE', paddingRight: 15, width: 85 },
  calendarIcon: { fontSize: 20 },
  dateText: { fontSize: 12, fontWeight: 'bold', color: '#7F8C8D', marginTop: 5 },
  previewContent: { flex: 1, paddingLeft: 15 },
  symptomePreview: { fontSize: 16, fontWeight: '500', color: '#2C3E50' },
  clickInfo: { fontSize: 12, color: '#00BFA5', marginTop: 5, fontWeight: 'bold' },
  emptyText: { textAlign: 'center', marginTop: 50, color: '#95A5A6' }
});

export default DossierMedicalScreen;