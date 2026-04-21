import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, StatusBar, ScrollView } from 'react-native';
import { updateStock } from '../../database/stockService';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import type { StockStackParamList } from './StockList';

const G = '#00BFA5';
const GL = '#161B22';

type Props = {
  navigation: NativeStackNavigationProp<StockStackParamList, 'StockArrivage'>;
  route: RouteProp<StockStackParamList, 'StockArrivage'>;
};

export default function StockArrivage({ navigation, route }: Props) {
  const { produit } = route.params;
  const [quantite, setQuantite] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAjout = async () => {
    const aAjouter = Number(quantite);
    if (isNaN(aAjouter) || aAjouter <= 0) {
      return Alert.alert('Erreur', 'Veuillez entrer une quantité valide.');
    }

    setLoading(true);
    try {
      await updateStock(produit.id, {
        ...produit,
        quantite: produit.quantite + aAjouter,
      });
      navigation.goBack();
    } catch (e) {
      Alert.alert('Erreur', 'Impossible de mettre à jour le stock.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={GL} />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Nouvel Arrivage</Text>
          <Text style={styles.headerSub}>Réception de marchandises</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Text style={styles.stockLabel}>Produit actuel</Text>
          <Text style={styles.produitNom}>{produit.nom}</Text>
          <View style={styles.stockRow}>
            <View style={styles.stockBox}>
              <Text style={styles.stockVal}>{produit.quantite}</Text>
              <Text style={styles.stockUnite}>{produit.unite} en stock</Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Quantité reçue</Text>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.quantiteInput}
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor="#484F58"
            value={quantite}
            onChangeText={setQuantite}
            autoFocus
          />
          <Text style={styles.uniteLabel}>{produit.unite}</Text>
        </View>

        <TouchableOpacity 
          style={[styles.confirmBtn, loading && styles.confirmBtnDisabled]} 
          onPress={handleAjout}
          disabled={loading}
        >
          <Text style={styles.confirmBtnText}>
            {loading ? 'Enregistrement...' : '📥 Valider l\'arrivage'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.cancelBtn}>
          <Text style={styles.cancelText}>Annuler</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: '#0D1117' },
  header:         { backgroundColor: GL, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, paddingTop: 20, borderBottomWidth: 1, borderBottomColor: '#30363D' },
  backBtn:        { width: 38, height: 38, borderRadius: 19, backgroundColor: '#0D1117', alignItems: 'center', justifyContent: 'center' },
  backIcon:       { fontSize: 20, color: G },
  headerTitle:    { fontSize: 17, fontWeight: '700', color: '#E6EDF3' },
  headerSub:      { fontSize: 12, color: '#8B949E', marginTop: 1 },
  content:        { padding: 16, gap: 20 },
  card:           { backgroundColor: GL, borderRadius: 16, padding: 18, borderWidth: 1, borderColor: '#30363D' },
  stockLabel:     { fontSize: 12, color: '#8B949E', marginBottom: 4 },
  produitNom:     { fontSize: 20, fontWeight: '700', color: '#E6EDF3', marginBottom: 12 },
  stockRow:       { alignItems: 'center', marginTop: 10 },
  stockBox:       { alignItems: 'center' },
  stockVal:       { fontSize: 36, fontWeight: '800', color: G },
  stockUnite:     { fontSize: 13, color: '#8B949E' },
  sectionTitle:   { fontSize: 13, fontWeight: '700', color: G, letterSpacing: 0.3, textTransform: 'uppercase' },
  inputRow:       { flexDirection: 'row', alignItems: 'center', gap: 12 },
  quantiteInput:  { flex: 1, backgroundColor: GL, borderRadius: 12, borderWidth: 2, borderColor: G, padding: 15, fontSize: 28, fontWeight: '800', color: '#E6EDF3', textAlign: 'center' },
  uniteLabel:     { fontSize: 16, color: '#E6EDF3', fontWeight: '600' },
  confirmBtn:     { backgroundColor: G, borderRadius: 14, padding: 17, alignItems: 'center', marginTop: 10 },
  confirmBtnDisabled: { opacity: 0.5 },
  confirmBtnText: { color: '#0D1117', fontSize: 16, fontWeight: '700' },
  cancelBtn:      { padding: 10, alignItems: 'center' },
  cancelText:     { color: '#8B949E', fontSize: 15 },
});