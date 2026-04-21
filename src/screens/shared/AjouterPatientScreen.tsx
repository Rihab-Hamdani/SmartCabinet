import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, ScrollView, 
  TouchableOpacity, Alert, StatusBar, KeyboardAvoidingView, Platform
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { PatientsStackParamList } from './PatientsScreen';
import { executeInsert, executeQuery } from '../../database/database';
import { ajouterRDV } from '../../database/rdvService'; 

type AjouterPatientRouteProp = RouteProp<PatientsStackParamList, 'AjouterPatient'>;

const AjouterPatientScreen = () => {
  const navigation = useNavigation();
  const route = useRoute<AjouterPatientRouteProp>();
  const { patient, role } = route.params;

  const isEdit = !!patient;

  // États du formulaire
  const [nom, setNom] = useState(patient?.nom || '');
  const [prenom, setPrenom] = useState(patient?.prenom || '');
  const [cin, setCin] = useState(patient?.cin || '');
  const [telephone, setTelephone] = useState(patient?.telephone || '');
  const [sexe, setSexe] = useState(patient?.sexe || 'M');
  const [dateN, setDateN] = useState(patient?.date_naissance || '');
  const [antecedents, setAntecedents] = useState(patient?.antecedents || '');
  
  // État pour le RDV (Uniquement pour la création d'un nouveau patient)
  const [dateRDV, setDateRDV] = useState(''); 

  const handleEnregistrer = async () => {
    if (!nom.trim() || !prenom.trim()) {
      Alert.alert("Erreur", "Le nom et le prénom sont obligatoires.");
      return;
    }

    try {
      if (isEdit) {
        // --- MODE MODIFICATION ---
        await executeQuery(`
          UPDATE patients 
          SET nom=?, prenom=?, cin=?, telephone=?, sexe=?, date_naissance=?, antecedents=?
          WHERE id=?
        `, [nom, prenom, cin, telephone, sexe, dateN, antecedents, patient.id]);
        Alert.alert("Succès", "Fiche patient mise à jour.");
      } else {
        // --- MODE CRÉATION ---
        // 1. Insérer le patient
        const patientId = await executeInsert(`
          INSERT INTO patients (nom, prenom, cin, telephone, sexe, date_naissance, antecedents)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [nom, prenom, cin, telephone, sexe, dateN, role === 'medecin' ? antecedents : '']);

        // 2. Si la secrétaire a saisi une date, créer le RDV lié
        if (dateRDV.trim() !== '') {
          await ajouterRDV({
            patient_id: patientId,
            date_heure: `${dateRDV}T09:00`, // Heure par défaut à 9h
            motif: 'Nouveau patient',
            statut: 'confirmé'
          });
        }
        Alert.alert("Succès", "Patient enregistré" + (dateRDV ? " avec son RDV." : "."));
      }
      navigation.goBack();
    } catch (error) {
      console.error(error);
      Alert.alert("Erreur", "Impossible d'enregistrer.");
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.scroll}>
        
        <View style={styles.header}>
          <Text style={styles.title}>{isEdit ? '✏️ Modifier Patient' : '👤 Nouveau Patient'}</Text>
          <Text style={styles.subtitle}>Informations administratives</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Nom *</Text>
          <TextInput style={styles.input} value={nom} onChangeText={setNom} placeholder="Ex: Ben Salah" placeholderTextColor="#484F58" />

          <Text style={styles.label}>Prénom *</Text>
          <TextInput style={styles.input} value={prenom} onChangeText={setPrenom} placeholder="Ex: Ahmed" placeholderTextColor="#484F58" />

          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: 10 }}>
              <Text style={styles.label}>CIN</Text>
              <TextInput style={styles.input} value={cin} onChangeText={setCin} keyboardType="numeric" placeholder="8 chiffres" placeholderTextColor="#484F58" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Téléphone</Text>
              <TextInput style={styles.input} value={telephone} onChangeText={setTelephone} keyboardType="phone-pad" placeholder="99 999 999" placeholderTextColor="#484F58" />
            </View>
          </View>

          <Text style={styles.label}>Sexe</Text>
          <View style={styles.genderContainer}>
            <TouchableOpacity 
              style={[styles.genderBtn, sexe === 'M' && styles.genderBtnActive]} 
              onPress={() => setSexe('M')}
            >
              <Text style={[styles.genderText, sexe === 'M' && styles.genderTextActive]}>Homme 👨</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.genderBtn, sexe === 'F' && styles.genderBtnActive]} 
              onPress={() => setSexe('F')}
            >
              <Text style={[styles.genderText, sexe === 'F' && styles.genderTextActive]}>Femme 👩</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Date de naissance (AAAA-MM-JJ)</Text>
          <TextInput style={styles.input} value={dateN} onChangeText={setDateN} placeholder="1990-05-20" placeholderTextColor="#484F58" />

          {/* RDV immédiat : Uniquement pour la secrétaire et lors d'une création */}
          {!isEdit && (
            <View style={styles.rdvBox}>
              <Text style={[styles.label, {color: '#00BFA5'}]}>📅 Fixer un RDV (AAAA-MM-JJ) - Optionnel</Text>
              <TextInput 
                style={[styles.input, {borderColor: '#00BFA5'}]} 
                value={dateRDV} 
                onChangeText={setDateRDV} 
                placeholder="Ex: 2026-04-16" 
                placeholderTextColor="#484F58" 
              />
            </View>
          )}

          {/* Antécédents : Uniquement visible/modifiable par le médecin */}
          {role === 'medecin' && (
            <>
              <Text style={styles.label}>Antécédents médicaux</Text>
              <TextInput 
                style={[styles.input, styles.textArea]} 
                value={antecedents} 
                onChangeText={setAntecedents} 
                multiline 
                numberOfLines={4}
                placeholder="Allergies, maladies chroniques..." 
                placeholderTextColor="#484F58" 
              />
            </>
          )}
        </View>

        <TouchableOpacity style={styles.saveBtn} onPress={handleEnregistrer}>
          <Text style={styles.saveBtnText}>{isEdit ? 'Mettre à jour' : 'Enregistrer le patient'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.cancelBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.cancelBtnText}>Annuler</Text>
        </TouchableOpacity>

      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D1117' },
  scroll: { padding: 20 },
  header: { marginBottom: 25 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#E6EDF3' },
  subtitle: { fontSize: 14, color: '#8B949E', marginTop: 5 },
  form: { gap: 15 },
  label: { color: '#8B949E', fontSize: 13, marginBottom: 5, fontWeight: '600' },
  input: {
    backgroundColor: '#161B22',
    borderWidth: 1,
    borderColor: '#30363D',
    borderRadius: 8,
    padding: 12,
    color: '#E6EDF3',
    fontSize: 15,
  },
  textArea: { height: 100, textAlignVertical: 'top' },
  row: { flexDirection: 'row' },
  genderContainer: { flexDirection: 'row', gap: 10, marginBottom: 5 },
  genderBtn: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#30363D',
    alignItems: 'center',
    backgroundColor: '#161B22'
  },
  genderBtnActive: { borderColor: '#00BFA5', backgroundColor: 'rgba(0, 191, 165, 0.1)' },
  genderText: { color: '#8B949E', fontWeight: '600' },
  genderTextActive: { color: '#00BFA5' },
  rdvBox: { marginTop: 10, padding: 10, backgroundColor: 'rgba(0, 191, 165, 0.05)', borderRadius: 8, borderWidth: 1, borderColor: '#30363D' },
  saveBtn: {
    backgroundColor: '#00BFA5',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 30,
  },
  saveBtnText: { color: '#0D1117', fontWeight: 'bold', fontSize: 16 },
  cancelBtn: { padding: 15, alignItems: 'center', marginTop: 10 },
  cancelBtnText: { color: '#F85149', fontSize: 14 }
});

export default AjouterPatientScreen;