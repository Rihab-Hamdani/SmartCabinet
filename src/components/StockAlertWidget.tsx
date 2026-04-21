import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { getStockAlertes } from '../../database/stockService';
import type { StockItem } from '../../database/stockService';
import type { StockStackParamList, Role } from '../shared/StockList';

interface Props {
  navigation: NativeStackNavigationProp<StockStackParamList>;
  role: Role;
}

const StockAlertWidget: React.FC<Props> = ({ navigation, role }) => {
  const [alertes, setAlertes] = useState<StockItem[]>([]);

  useFocusEffect(useCallback(() => {
    getStockAlertes()
      .then(data => setAlertes(data.slice(0, 3)))
      .catch(() => {});
  }, []));

  if (alertes.length === 0) return null;

  return (
    <View style={styles.widget}>
      <View style={styles.widgetHeader}>
        <Text style={styles.widgetTitle}>⚠️ Alertes Stock ({alertes.length})</Text>
        <TouchableOpacity onPress={() => navigation.navigate('StockList', { role })}>
          <Text style={styles.voirTout}>Voir tout →</Text>
        </TouchableOpacity>
      </View>
      {alertes.map(item => (
        <View key={item.id} style={styles.alerteItem}>
          <View style={styles.alerteLeft}>
            <Text style={styles.alerteNom}>{item.nom}</Text>
            <Text style={styles.alerteCat}>{item.categorie}</Text>
          </View>
          <View style={styles.alerteRight}>
            <Text style={[styles.alerteQty, item.quantite === 0 && styles.alerteQtyVide]}>
              {item.quantite === 0 ? 'Épuisé' : `${item.quantite} ${item.unite}`}
            </Text>
            <Text style={styles.alerteSeuil}>/ {item.seuil_alerte}</Text>
          </View>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  widget: { backgroundColor: '#fff8e1', borderRadius: 14, padding: 14, marginVertical: 8, borderLeftWidth: 4, borderLeftColor: '#ff6f00', elevation: 2 },
  widgetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  widgetTitle: { fontSize: 14, fontWeight: '700', color: '#e65100' },
  voirTout: { fontSize: 13, color: '#1a237e', fontWeight: '600' },
  alerteItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#ffe082' },
  alerteLeft: { flex: 1 },
  alerteNom: { fontSize: 14, fontWeight: '600', color: '#37474f' },
  alerteCat: { fontSize: 11, color: '#90a4ae' },
  alerteRight: { flexDirection: 'row', alignItems: 'baseline' },
  alerteQty: { fontSize: 16, fontWeight: 'bold', color: '#ff6f00' },
  alerteQtyVide: { color: '#e53935' },
  alerteSeuil: { fontSize: 12, color: '#90a4ae', marginLeft: 2 },
});

export default StockAlertWidget;