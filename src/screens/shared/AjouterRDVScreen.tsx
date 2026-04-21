import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, 
  TextInput, Alert, ScrollView, StatusBar
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { PatientsStackParamList } from './PatientsScreen';
import { ajouterRDV } from '../../database/rdvService';

type RouteProps = RouteProp<PatientsStackParamList, 'AjouterRDV'>;

const AjouterRDVScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProps>();
  
  // Récupération des données du patient
  const { patientId, patientNom } = route.params || {};

  // Initialisation avec la date du jour
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]); 
  const [heure, setHeure] = useState('09:00');
  const [motif, setMotif] = useState('');

  const handleValider = async () => {
    // 1. Validation des champs vides
    if (!date || !heure) {
      Alert.alert("Erreur", "Veuillez remplir la date et l'heure.");
      return;
    }

    // 2. Vérification du format de date (AAAA-MM-JJ)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      Alert.alert("Format invalide", "La date doit être au format AAAA-MM-JJ");
      return;
    }

    try {
      // 3. Préparation du format ISO
      const dateHeure = `${date}T${heure}:00`;
      
      // 4. Appel SQL pour ajouter un NOUVEAU rendez-vous
      await ajouterRDV({
        patient_id: patientId,
        date_heure: dateHeure,
        motif: motif,
        statut: 'confirmé'
      });
  
      Alert.alert(
        "Succès", 
        "Nouveau rendez-vous enregistré !",
        [{ 
          text: "OK", 
          onPress: () => navigation.goBack() 
        }]
      );
    } catch (error: any) {
      Alert.alert("Erreur", "Impossible d'enregistrer le RDV : " + error.message);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.scroll}>
        
        <View style={styles.header}>
            <Text style={styles.title}>📅 Nouveau Rendez-vous</Text>
        </View>
        
        <View style={styles.infoCard}>
          <Text style={styles.label}>PATIENT SÉLECTIONNÉ</Text>
          <Text style={styles.patientValue}>{patientNom || "Patient inconnu"}</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>DATE (FORMAT: AAAA-MM-JJ)</Text>
            <TextInput 
                style={styles.input} 
                value={date} 
                onChangeText={setDate} 
                placeholder="2026-04-15"
                placeholderTextColor="#484F58"
                keyboardType="numeric"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>HEURE (FORMAT: HH:MM)</Text>
            <TextInput 
                style={styles.input} 
                value={heure} 
                onChangeText={setHeure} 
                placeholder="14:30"
                placeholderTextColor="#484F58"
                keyboardType="numeric"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>MOTIF DE LA VISITE</Text>
            <TextInput 
                style={[styles.input, styles.textArea]} 
                value={motif} 
                onChangeText={setMotif} 
                multiline
                numberOfLines={4}
                placeholder="Ex: Contrôle annuel, douleurs, etc..."
                placeholderTextColor="#484F58"
            />
          </View>
        </View>

        <TouchableOpacity style={styles.btnSave} onPress={handleValider}>
          <Text style={styles.btnSaveText}>Confirmer le Rendez-vous</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.btnBack}>
          <Text style={styles.btnBackText}>Annuler</Text>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D1117' },
  scroll: { padding: 20, paddingTop: 60 },
  header: { marginBottom: 20 },
  title: { fontSize: 24, fontWeight: '800', color: '#E6EDF3' },
  infoCard: { 
    backgroundColor: '#161B22', 
    padding: 18, 
    borderRadius: 12, 
    marginBottom: 25, 
    borderWidth: 1, 
    borderColor: '#30363D',
    borderLeftWidth: 4,
    borderLeftColor: '#00BFA5'
  },
  label: { color: '#8B949E', fontSize: 11, marginBottom: 8, fontWeight: '700', letterSpacing: 1 },
  patientValue: { color: '#E6EDF3', fontSize: 20, fontWeight: 'bold' },
  form: { gap: 20 },
  inputGroup: { marginBottom: 5 },
  input: { 
    backgroundColor: '#161B22', 
    borderRadius: 10, 
    padding: 15, 
    color: '#E6EDF3', 
    borderWidth: 1, 
    borderColor: '#30363D', 
    fontSize: 16 
  },
  textArea: { height: 100, textAlignVertical: 'top' },
  btnSave: { 
    backgroundColor: '#00BFA5', 
    padding: 18, 
    borderRadius: 12, 
    alignItems: 'center', 
    marginTop: 30,
    elevation: 5
  },
  btnSaveText: { color: '#0D1117', fontWeight: '800', fontSize: 16 },
  btnBack: { marginTop: 15, alignItems: 'center', padding: 10 },
  btnBackText: { color: '#F85149', fontSize: 15, fontWeight: '600' }
});

export default AjouterRDVScreen;