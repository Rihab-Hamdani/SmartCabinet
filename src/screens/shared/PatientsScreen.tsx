import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  TextInput, Alert, ActivityIndicator, StatusBar,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { getAllPatients, rechercherPatients, supprimerPatient } from '../../database/rdvService';
import type { Patient } from '../../database/rdvService';

export type Role = 'secretaire' | 'medecin';

// Définition du typage de la navigation
export type PatientsStackParamList = {
  Calendrier: { role: Role };
  PatientsList:    { role: Role };
  AjouterPatient:  { patient?: Patient; role: Role };
  DetailPatient:   { patientId: number; patientNom: string; role: Role };
  AjouterRDV:      { patientId: number; patientNom: string; role: Role };
};

type Props = {
  navigation: NativeStackNavigationProp<PatientsStackParamList, 'PatientsList'>;
  route:      RouteProp<PatientsStackParamList, 'PatientsList'>;
};

const PatientsScreen: React.FC<Props> = ({ navigation, route }) => {
  const role         = route?.params?.role ?? 'secretaire';
  const isSecretaire = role === 'secretaire';

  const [patients,  setPatients]  = useState<Patient[]>([]);
  const [search,    setSearch]    = useState('');
  const [loading,   setLoading]   = useState(true);

  // Fonction de chargement des données
  const charger = useCallback(async () => {
    setLoading(true);
    try {
      const data = search.trim()
        ? await rechercherPatients(search)
        : await getAllPatients();
      setPatients(data);
    } catch {
      Alert.alert('Erreur', 'Impossible de charger les patients');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useFocusEffect(useCallback(() => { charger(); }, [charger]));

  const handleDelete = (p: Patient) => {
    Alert.alert('Supprimer', `Supprimer "${p.nom} ${p.prenom}" ?`, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer', style: 'destructive',
        onPress: async () => { 
          await supprimerPatient(p.id); 
          charger(); 
        },
      },
    ]);
  };

  const calculerAge = (dateNaissance?: string): string => {
    if (!dateNaissance) return '';
    const age = new Date().getFullYear() - new Date(dateNaissance).getFullYear();
    return `${age} ans`;
  };

  const renderItem = ({ item }: { item: Patient }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('DetailPatient', { 
        patientId: item.id, 
        patientNom: `${item.prenom} ${item.nom}`,
        role 
      })}
      activeOpacity={0.8}>
      
      <View style={styles.cardLeft}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {item.sexe === 'F' ? '👩' : '👨'}
          </Text>
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.cardNom}>{item.nom} {item.prenom}</Text>
          <Text style={styles.cardSub}>
            {[calculerAge(item.date_naissance), item.telephone].filter(Boolean).join(' · ')}
          </Text>
          {item.cin ? <Text style={styles.cardCin}>CIN: {item.cin}</Text> : null}
        </View>
      </View>

      {isSecretaire && (
        <View style={styles.cardActions}>
          {/* BOUTON PRENDRE RDV (Pour patient existant) */}
          <TouchableOpacity 
            style={styles.rdvBtn}
            onPress={() => navigation.navigate('AjouterRDV', { 
              patientId: item.id, 
              patientNom: `${item.prenom} ${item.nom}`,
              role: role
            })}
          >
            <Text style={styles.rdvBtnTxt}>RDV 📅</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.editBtn}
            onPress={() => navigation.navigate('AjouterPatient', { patient: item, role })}>
            <Text style={styles.editBtnIcon}>✏️</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={() => handleDelete(item)}>
            <Text style={styles.deleteBtnIcon}>🗑️</Text>
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#161B22" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>👥 Patients</Text>
        <Text style={styles.headerSub}>
          {isSecretaire ? 'Gestion complète' : 'Consultation uniquement'}
        </Text>
      </View>

      {/* Barre de Recherche */}
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher un patient..."
            placeholderTextColor="#484F58"
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={charger}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Text style={styles.clearBtn}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <Text style={styles.count}>{patients.length} patient(s) trouvé(s)</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#00BFA5" style={{ marginTop: 60 }} />
      ) : patients.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>👥</Text>
          <Text style={styles.emptyTitle}>Aucun patient</Text>
          <Text style={styles.emptyDesc}>
            {search ? 'Aucun résultat pour cette recherche.' : 'La base de données est vide.'}
          </Text>
          {isSecretaire && !search && (
            <TouchableOpacity
              style={styles.emptyBtn}
              onPress={() => navigation.navigate('AjouterPatient', { role })}>
              <Text style={styles.emptyBtnTxt}>+ Ajouter un patient</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={patients}
          keyExtractor={item => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 14, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Bouton Flottant (Ajouter) pour secrétaire */}
      {isSecretaire && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => navigation.navigate('AjouterPatient', { role })}
          activeOpacity={0.85}>
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#0D1117' },
  header:       { backgroundColor: '#161B22', padding: 18, paddingTop: 50, borderBottomWidth: 1, borderBottomColor: '#30363D' },
  headerTitle:  { fontSize: 22, fontWeight: '800', color: '#E6EDF3' },
  headerSub:    { fontSize: 13, color: '#8B949E', marginTop: 2 },
  searchRow:    { padding: 14, paddingBottom: 6 },
  searchBox:    { flexDirection: 'row', alignItems: 'center', backgroundColor: '#161B22', borderRadius: 12, borderWidth: 1.5, borderColor: '#30363D', paddingHorizontal: 12 },
  searchIcon:   { fontSize: 15, marginRight: 6 },
  searchInput:  { flex: 1, paddingVertical: 11, fontSize: 14, color: '#E6EDF3' },
  clearBtn:     { color: '#484F58', fontSize: 16, paddingHorizontal: 8 },
  count:        { fontSize: 12, color: '#484F58', paddingHorizontal: 16, paddingBottom: 4 },
  
  card:         { backgroundColor: '#161B22', borderRadius: 14, marginBottom: 10, padding: 14, borderWidth: 1, borderColor: '#30363D', flexDirection: 'row', alignItems: 'center' },
  cardLeft:     { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 12 },
  avatar:       { width: 44, height: 44, borderRadius: 22, backgroundColor: '#0D1117', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#30363D' },
  avatarText:   { fontSize: 22 },
  cardInfo:     { flex: 1 },
  cardNom:      { fontSize: 15, fontWeight: '700', color: '#E6EDF3' },
  cardSub:      { fontSize: 12, color: '#8B949E', marginTop: 2 },
  cardCin:      { fontSize: 11, color: '#484F58', marginTop: 2 },
  
  cardActions:  { flexDirection: 'row', gap: 6, alignItems: 'center' },
  rdvBtn:       { backgroundColor: '#0D1117', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 6, borderWidth: 1, borderColor: '#00BFA5' },
  rdvBtnTxt:    { color: '#00BFA5', fontSize: 11, fontWeight: 'bold' },
  editBtn:      { backgroundColor: '#1C2128', borderRadius: 8, padding: 6, borderWidth: 1, borderColor: '#388BFD' },
  editBtnIcon:  { fontSize: 14 },
  deleteBtn:    { backgroundColor: '#1C2128', borderRadius: 8, padding: 6, borderWidth: 1, borderColor: '#F85149' },
  deleteBtnIcon:{ fontSize: 14 },
  
  empty:        { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyIcon:    { fontSize: 56, marginBottom: 14 },
  emptyTitle:   { fontSize: 18, fontWeight: '700', color: '#E6EDF3', marginBottom: 6 },
  emptyDesc:    { fontSize: 14, color: '#8B949E', textAlign: 'center', marginBottom: 20 },
  emptyBtn:     { backgroundColor: '#00BFA5', borderRadius: 12, paddingHorizontal: 24, paddingVertical: 13 },
  emptyBtnTxt:  { color: '#0D1117', fontWeight: '700', fontSize: 15 },
  
  fab:          { position: 'absolute', bottom: 24, right: 20, width: 56, height: 56, borderRadius: 28, backgroundColor: '#00BFA5', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 4.65, elevation: 8 },
  fabText:      { color: '#0D1117', fontSize: 28, lineHeight: 32 },
});

export default PatientsScreen;