import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, SafeAreaView, ActivityIndicator } from 'react-native';
import { imprimerOrdonnancePDF } from '../../services/pdfService';
// Assure-toi que cette fonction existe dans ton rdvService ou medicalService
import { getMedicamentsParConsultation } from '../../database/rdvService'; 

const ConsultationDetailScreen = ({ route }: any) => {
  // Récupération des données passées par la navigation
  const { consultation, patient } = route.params;
  const [chargement, setChargement] = useState(false);

  const handleGenererPDF = async () => {
    setChargement(true);
    try {
      // 1. Récupération des médicaments associés à cette consultation
      const meds = await getMedicamentsParConsultation(consultation.id);
      
      if (!meds || meds.length === 0) {
        Alert.alert("Attention", "Aucun médicament n'a été prescrit lors de cette visite.");
        return;
      }

      // 2. Formatage pour le PDF (On transforme la liste en texte lisible)
      // On s'assure de gérer le cas où remarques_medicament existe
      const medsFormatted = meds.map((m: any) => ({
        nom_medicament: m.nom_medicament,
        posologie: m.posologie,
        remarques_medicament: m.remarques_medicament || ''
      }));
      
      // 3. Appel du service PDF natif (React Native CLI)
      await imprimerOrdonnancePDF(patient, { 
        ...consultation, 
        medicaments: medsFormatted // On passe l'objet complet au service PDF
      });
      
    } catch (error) {
      Alert.alert("Erreur", "Problème lors de la création du document PDF.");
      console.error(error);
    } finally {
      setChargement(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.mainTitle}>Visite du {consultation.date_cons}</Text>
          
          {/* SECTION 1 : OBSERVATIONS */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>👁️ Observations Cliniques</Text>
            <View style={styles.bubble}>
              <Text style={styles.label}>Symptômes rapportés :</Text>
              <Text style={styles.content}>{consultation.symptomes || "Aucun symptôme renseigné"}</Text>
              
              <View style={styles.divider} />
              
              <Text style={styles.label}>Notes du praticien :</Text>
              <Text style={styles.content}>{consultation.remarques_medecin || "Aucune note privée"}</Text>
            </View>
          </View>

          {/* SECTION 2 : DOCUMENTS & ACTIONS */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📄 Documents</Text>
            <TouchableOpacity 
              style={[styles.pdfButton, chargement && { backgroundColor: '#7F8C8D' }]} 
              onPress={handleGenererPDF}
              disabled={chargement}
            >
              {chargement ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.pdfButtonText}>Générer l'Ordonnance PDF</Text>
              )}
            </TouchableOpacity>
            <Text style={styles.footerNote}>
              Le fichier sera généré et prêt à être partagé ou imprimé.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0D1117' }, // Harmonisation avec ton thème sombre
  container: { flex: 1, padding: 15 },
  card: { backgroundColor: '#161B22', borderRadius: 15, padding: 20, borderWidth: 1, borderColor: '#30363D' },
  mainTitle: { fontSize: 20, fontWeight: 'bold', color: '#E6EDF3', marginBottom: 25, textAlign: 'center' },
  section: { marginBottom: 30 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#00BFA5', marginBottom: 12 },
  bubble: { backgroundColor: '#0D1117', padding: 15, borderRadius: 12, borderLeftWidth: 5, borderLeftColor: '#00BFA5' },
  label: { fontSize: 11, color: '#8B949E', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 4 },
  content: { fontSize: 16, color: '#E6EDF3', marginBottom: 10, lineHeight: 22 },
  divider: { height: 1, backgroundColor: '#30363D', marginVertical: 12 },
  pdfButton: { backgroundColor: '#238636', paddingVertical: 16, borderRadius: 10, alignItems: 'center', marginTop: 10 },
  pdfButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  footerNote: { fontSize: 11, color: '#8B949E', marginTop: 12, textAlign: 'center', fontStyle: 'italic' }
});

export default ConsultationDetailScreen;