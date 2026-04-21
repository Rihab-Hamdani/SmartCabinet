import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, ScrollView, StatusBar,
} from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { addStock, updateStock } from '../../database/stockService';
import type { StockStackParamList } from './StockList';

type Props = {
  navigation: NativeStackNavigationProp<StockStackParamList, 'StockForm'>;
  route:      RouteProp<StockStackParamList, 'StockForm'>;
};

const G = '#00BFA5';

export default function StockForm({ navigation, route }: Props) {
  const produit = route.params?.produit;
  const isEdit  = !!produit;

  const [nom,         setNom]         = useState(produit?.nom          ?? '');
  const [unite,       setUnite]       = useState(produit?.unite        ?? '');
  const [quantite,    setQuantite]    = useState(String(produit?.quantite     ?? ''));
  const [seuilAlerte, setSeuilAlerte] = useState(String(produit?.seuil_alerte ?? ''));
  const [saving,      setSaving]      = useState(false);

  const handleSave = async () => {
    if (!nom.trim())              return Alert.alert('Erreur', 'Le nom est obligatoire.');
    if (!unite.trim())            return Alert.alert('Erreur', 'L\'unité est obligatoire.');
    if (isNaN(Number(quantite)))  return Alert.alert('Erreur', 'Quantité invalide.');
    if (isNaN(Number(seuilAlerte))) return Alert.alert('Erreur', 'Seuil invalide.');

    setSaving(true);
    try {
      if (isEdit) {
        await updateStock(produit.id, {
          nom: nom.trim(),
          unite: unite.trim(),
          quantite: Number(quantite),
          seuil_alerte: Number(seuilAlerte),
        });
      } else {
        await addStock({
          nom: nom.trim(),
          unite: unite.trim(),
          quantite: Number(quantite),
          seuil_alerte: Number(seuilAlerte),
        });
      }
      navigation.goBack();
    } catch (e: any) {
      Alert.alert('Erreur', e?.message ?? 'Impossible de sauvegarder.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#161B22" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Retour</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isEdit ? 'Modifier le produit' : 'Nouveau produit'}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.form}>
        <Field label="Nom du produit *"     value={nom}         onChangeText={setNom}         placeholder="Ex: Gants latex" />
        <Field label="Unité *"              value={unite}       onChangeText={setUnite}       placeholder="Ex: boîte, flacon, pièce" />
        <Field label="Quantité initiale *"  value={quantite}    onChangeText={setQuantite}    placeholder="0" keyboardType="numeric" />
        <Field label="Seuil d'alerte *"     value={seuilAlerte} onChangeText={setSeuilAlerte} placeholder="5" keyboardType="numeric" />

        <TouchableOpacity
          style={[styles.saveBtn, saving && { opacity: 0.6 }]}
          onPress={handleSave}
          disabled={saving}>
          <Text style={styles.saveBtnText}>
            {saving ? 'Enregistrement...' : isEdit ? '✅ Modifier' : '✅ Ajouter'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function Field({ label, value, onChangeText, placeholder, keyboardType = 'default' }: any) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#484F58"
        keyboardType={keyboardType}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: '#0D1117' },
  header:      { backgroundColor: '#161B22', padding: 18, paddingTop: 20, borderBottomWidth: 1, borderBottomColor: '#30363D' },
  backBtn:     { marginBottom: 8 },
  backText:    { color: '#00BFA5', fontSize: 14, fontWeight: '600' },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#E6EDF3' },
  form:        { padding: 20, gap: 16 },
  fieldGroup:  { gap: 6 },
  label:       { fontSize: 13, fontWeight: '700', color: '#8B949E' },
  input:       { backgroundColor: '#161B22', borderRadius: 12, borderWidth: 1.5, borderColor: '#30363D', paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#E6EDF3' },
  saveBtn:     { backgroundColor: '#00BFA5', borderRadius: 14, paddingVertical: 15, alignItems: 'center', marginTop: 10 },
  saveBtnText: { color: '#0D1117', fontSize: 16, fontWeight: '800' },
});