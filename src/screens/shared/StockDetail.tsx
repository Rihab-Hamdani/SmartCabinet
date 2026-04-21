import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, ScrollView, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getStockById, deleteStock } from '../../database/stockService';
import type { StockItem } from '../../database/stockService';

const G = '#00BFA5';
const GL = '#161B22';

export default function StockDetail({ route, navigation }: any) {
  const { produitId, role } = route.params;
  const isSecretaire = role === 'secretaire';
  const [item, setItem] = useState<StockItem | null>(null);

  const chargerProduit = useCallback(async () => {
    const data = await getStockById(produitId);
    if (data) setItem(data);
  }, [produitId]);

  useFocusEffect(useCallback(() => { chargerProduit(); }, [chargerProduit]));

  const handleDelete = () => {
    Alert.alert("Supprimer", "Voulez-vous supprimer ce produit du stock ?", [
      { text: "Annuler", style: "cancel" },
      { text: "Supprimer", style: "destructive", onPress: async () => {
          await deleteStock(produitId);
          navigation.goBack();
      }}
    ]);
  };

  if (!item) return null;

  const enAlerte = item.quantite <= item.seuil_alerte;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={GL} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Détails du produit</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.card, enAlerte && styles.cardAlerte]}>
           <Text style={styles.label}>Nom du produit</Text>
           <Text style={styles.valNom}>{item.nom}</Text>
           
           <View style={styles.divider} />
           
           <View style={styles.row}>
              <View style={styles.col}>
                <Text style={styles.label}>Stock Actuel</Text>
                <Text style={[styles.valLarge, enAlerte ? {color: '#f59e0b'} : {color: G}]}>
                  {item.quantite} <Text style={styles.valUnite}>{item.unite}</Text>
                </Text>
              </View>
              <View style={styles.col}>
                <Text style={styles.label}>Seuil d'alerte</Text>
                <Text style={styles.valMedium}>{item.seuil_alerte} {item.unite}</Text>
              </View>
           </View>
        </View>

        <Text style={styles.sectionTitle}>Actions rapides</Text>
        
        <TouchableOpacity 
          style={styles.actionRow} 
          onPress={() => navigation.navigate('StockRetirer', { produit: item })}
        >
          <Text style={styles.actionIcon}>➖</Text>
          <Text style={styles.actionText}>Retirer du stock / Utiliser</Text>
        </TouchableOpacity>

        {isSecretaire && (
          <>
            <TouchableOpacity 
              style={styles.actionRow}
              onPress={() => navigation.navigate('StockArrivage', { produit: item })}
            >
              <Text style={styles.actionIcon}>📥</Text>
              <Text style={styles.actionText}>Enregistrer un arrivage</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionRow}
              onPress={() => navigation.navigate('StockForm', { produit: item, role })}
            >
              <Text style={styles.actionIcon}>✏️</Text>
              <Text style={styles.actionText}>Modifier les informations</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.actionRow, styles.deleteRow]} onPress={handleDelete}>
              <Text style={styles.actionIcon}>🗑️</Text>
              <Text style={[styles.actionText, {color: '#F85149'}]}>Supprimer définitivement</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#0D1117' },
  header:       { backgroundColor: GL, flexDirection: 'row', alignItems: 'center', gap: 15, padding: 16, paddingTop: 20, borderBottomWidth: 1, borderBottomColor: '#30363D' },
  backBtn:      { width: 38, height: 38, borderRadius: 19, backgroundColor: '#0D1117', alignItems: 'center', justifyContent: 'center' },
  backIcon:     { fontSize: 20, color: G },
  headerTitle:  { fontSize: 18, fontWeight: '700', color: '#E6EDF3' },
  content:      { padding: 16 },
  card:         { backgroundColor: GL, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#30363D', marginBottom: 25 },
  cardAlerte:   { borderColor: '#f59e0b', borderLeftWidth: 5 },
  label:        { fontSize: 12, color: '#8B949E', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 5 },
  valNom:       { fontSize: 22, fontWeight: '800', color: '#E6EDF3' },
  divider:      { height: 1, backgroundColor: '#30363D', marginVertical: 15 },
  row:          { flexDirection: 'row', justifyContent: 'space-between' },
  col:          { flex: 1 },
  valLarge:     { fontSize: 32, fontWeight: '800' },
  valMedium:    { fontSize: 18, fontWeight: '600', color: '#E6EDF3' },
  valUnite:     { fontSize: 14, fontWeight: '400', color: '#8B949E' },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#8B949E', textTransform: 'uppercase', marginBottom: 15 },
  actionRow:    { flexDirection: 'row', alignItems: 'center', backgroundColor: GL, padding: 16, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: '#30363D' },
  deleteRow:    { borderColor: '#2d0f0f' },
  actionIcon:   { fontSize: 20, marginRight: 15 },
  actionText:   { fontSize: 15, color: '#E6EDF3', fontWeight: '600' },
});