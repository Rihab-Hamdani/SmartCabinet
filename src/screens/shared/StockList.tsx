import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import {
  getAllStock,
  deleteStock,
  countAlertes,
} from '../../database/stockService';
import type { StockItem } from '../../database/stockService';
export type Role = 'secretaire' | 'medecin';

export type StockStackParamList = {
  StockList: { role: Role };
  StockForm: { produit?: StockItem; role: Role };
  StockDetail: { produitId: number; role: Role };
  StockRetirer: { produit: StockItem };
  StockArrivage: { produit: StockItem };
};

type Props = {
  navigation: NativeStackNavigationProp<StockStackParamList, 'StockList'>;
  route: RouteProp<StockStackParamList, 'StockList'>;
};

const G = '#00BFA5';
const GL = '#161B22';

const StockList: React.FC<Props> = ({ navigation, route }) => {
  const role = route?.params?.role ?? 'secretaire';
  const isSecretaire = role === 'secretaire';

  const [stock, setStock] = useState<StockItem[]>([]);
  const [filtered, setFiltered] = useState<StockItem[]>([]);
  const [search, setSearch] = useState('');
  const [alerteCount, setAlerteCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filterAlerte, setFilterAlerte] = useState(false);

  const appliquerFiltres = (
    data: StockItem[],
    terme: string,
    alertOnly: boolean,
  ) => {
    let res = [...data];
    if (alertOnly) res = res.filter(p => p.quantite <= p.seuil_alerte);
    if (terme.trim())
      res = res.filter(p => p.nom.toLowerCase().includes(terme.toLowerCase()));
    setFiltered(res);
  };

  const chargerStock = useCallback(async () => {
    setLoading(true);
    try {
      const [data, count] = await Promise.all([getAllStock(), countAlertes()]);
      setStock(data);
      setAlerteCount(count);
      appliquerFiltres(data, search, filterAlerte);
    } catch {
      Alert.alert('Erreur', 'Impossible de charger le stock');
    } finally {
      setLoading(false);
    }
  }, [search, filterAlerte]);

  useFocusEffect(
    useCallback(() => {
      chargerStock();
    }, [chargerStock]),
  );

  const handleSearch = (val: string) => {
    setSearch(val);
    appliquerFiltres(stock, val, filterAlerte);
  };

  const toggleAlerte = () => {
    const next = !filterAlerte;
    setFilterAlerte(next);
    appliquerFiltres(stock, search, next);
  };

  const handleDelete = (item: StockItem) => {
    Alert.alert('Supprimer', `Supprimer "${item.nom}" définitivement ?`, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          await deleteStock(item.id);
          chargerStock();
        },
      },
    ]);
  };

  const renderItem = ({ item }: { item: StockItem }) => {
    const enAlerte = item.quantite <= item.seuil_alerte;
    const epuise = item.quantite === 0;
    const pct = Math.min(
      100,
      Math.round((item.quantite / Math.max(item.seuil_alerte * 3, 1)) * 100),
    );

    return (
      <View style={[styles.card, enAlerte && styles.cardAlerte]}>
        {/* En-tête cliquable pour voir les détails */}
        <TouchableOpacity
          style={styles.cardHeader}
          onPress={() =>
            navigation.navigate('StockDetail', { produitId: item.id, role })
          }
        >
          <View style={styles.cardHeaderLeft}>
            <View
              style={[
                styles.statusDot,
                epuise
                  ? styles.dotEpuise
                  : enAlerte
                  ? styles.dotAlerte
                  : styles.dotOk,
              ]}
            />
            <Text style={styles.cardNom} numberOfLines={1}>
              {item.nom}
            </Text>
          </View>
          <View
            style={[
              styles.badge,
              epuise
                ? styles.badgeEpuise
                : enAlerte
                ? styles.badgeAlerte
                : styles.badgeOk,
            ]}
          >
            <Text
              style={[
                styles.badgeText,
                epuise
                  ? styles.badgeTextEpuise
                  : enAlerte
                  ? styles.badgeTextAlerte
                  : styles.badgeTextOk,
              ]}
            >
              {epuise ? 'ÉPUISÉ' : enAlerte ? 'ALERTE' : 'OK'}
            </Text>
          </View>
        </TouchableOpacity>

        <View style={styles.qRow}>
          <Text
            style={[
              styles.qVal,
              epuise ? styles.qEpuise : enAlerte ? styles.qAlerte : styles.qOk,
            ]}
          >
            {item.quantite}
          </Text>
          <Text style={styles.qUnite}>{item.unite}</Text>
          <Text style={styles.qSeuil}> / seuil {item.seuil_alerte}</Text>
        </View>

        <View style={styles.jauge}>
          <View
            style={[
              styles.jaugeFill,
              {
                width: `${pct}%` as any,
                backgroundColor: epuise ? '#F85149' : enAlerte ? '#f59e0b' : G,
              },
            ]}
          />
        </View>

        <View style={styles.actions}>
          {isSecretaire ? (
            <>
              <TouchableOpacity
                style={[styles.actionBtn, styles.actionRetirer]}
                onPress={() =>
                  navigation.navigate('StockRetirer', { produit: item })
                }
              >
                <Text style={styles.actionRetirerText}>➖ Utiliser</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, styles.actionArrivage]}
                onPress={() =>
                  navigation.navigate('StockArrivage', { produit: item })
                }
              >
                <Text style={styles.actionArrivageText}>📥</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, styles.actionEdit]}
                onPress={() =>
                  navigation.navigate('StockForm', { produit: item, role })
                }
              >
                <Text style={styles.actionEditText}>✏️</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, styles.actionDelete]}
                onPress={() => handleDelete(item)}
              >
                <Text style={styles.actionDeleteText}>🗑️</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              style={[styles.actionBtn, styles.actionRetirer, { flex: 1 }]}
              onPress={() =>
                navigation.navigate('StockRetirer', { produit: item })
              }
            >
              <Text style={styles.actionRetirerText}>
                ➖ Marquer utilisation
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#161B22" />

      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>Stock Équipements</Text>
            <Text style={styles.headerSub}>
              {isSecretaire
                ? 'Secrétaire — Gestion complète'
                : 'Médecin — Consultation'}
            </Text>
          </View>
          {alerteCount > 0 && (
            <View style={styles.alerteBubble}>
              <Text style={styles.alerteBubbleNum}>{alerteCount}</Text>
              <Text style={styles.alerteBubbleLabel}>
                alerte{alerteCount > 1 ? 's' : ''}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statPill}>
            <Text style={styles.statPillNum}>{stock.length}</Text>
            <Text style={styles.statPillLabel}>produits</Text>
          </View>
          <View
            style={[styles.statPill, alerteCount > 0 && styles.statPillAlerte]}
          >
            <Text
              style={[
                styles.statPillNum,
                alerteCount > 0 && { color: '#f59e0b' },
              ]}
            >
              {alerteCount}
            </Text>
            <Text
              style={[
                styles.statPillLabel,
                alerteCount > 0 && { color: '#f59e0b' },
              ]}
            >
              alertes
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher..."
            placeholderTextColor="#484F58"
            value={search}
            onChangeText={handleSearch}
          />
        </View>
        <TouchableOpacity
          style={[styles.filterBtn, filterAlerte && styles.filterBtnActive]}
          onPress={toggleAlerte}
        >
          <Text
            style={[
              styles.filterBtnText,
              filterAlerte && styles.filterBtnTextActive,
            ]}
          >
            ⚠️ Alertes
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={G} style={{ marginTop: 60 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 14, paddingBottom: 110 }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>📦</Text>
              <Text style={styles.emptyTitle}>Aucun produit</Text>
              <Text style={styles.emptyDesc}>
                {search ? 'Recherche infructueuse.' : 'Stock vide.'}
              </Text>
            </View>
          }
        />
      )}

      {isSecretaire && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => navigation.navigate('StockForm', { role })}
        >
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D1117' },
  header: {
    backgroundColor: '#161B22',
    padding: 18,
    paddingTop: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#30363D',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#E6EDF3' },
  headerSub: { fontSize: 13, color: '#8B949E', marginTop: 2 },
  alerteBubble: {
    backgroundColor: '#2d1f00',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f59e0b',
  },
  alerteBubbleNum: { fontSize: 20, fontWeight: '800', color: '#f59e0b' },
  alerteBubbleLabel: { fontSize: 10, color: '#f59e0b', fontWeight: '600' },
  statsRow: { flexDirection: 'row', gap: 8 },
  statPill: {
    flex: 1,
    backgroundColor: '#0D1117',
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#30363D',
  },
  statPillAlerte: { backgroundColor: '#2d1f00', borderColor: '#f59e0b' },
  statPillNum: { fontSize: 18, fontWeight: '800', color: '#E6EDF3' },
  statPillLabel: { fontSize: 11, color: '#8B949E', marginTop: 1 },
  searchRow: { flexDirection: 'row', gap: 8, padding: 14, paddingBottom: 6 },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#161B22',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#30363D',
    paddingHorizontal: 12,
  },
  searchIcon: { fontSize: 15, marginRight: 6 },
  searchInput: { flex: 1, paddingVertical: 11, fontSize: 14, color: '#E6EDF3' },
  filterBtn: {
    backgroundColor: '#161B22',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#30363D',
    paddingHorizontal: 14,
    justifyContent: 'center',
  },
  filterBtnActive: { backgroundColor: '#2d1f00', borderColor: '#f59e0b' },
  filterBtnText: { fontSize: 13, fontWeight: '600', color: '#8B949E' },
  filterBtnTextActive: { color: '#f59e0b' },
  card: {
    backgroundColor: '#161B22',
    borderRadius: 16,
    marginBottom: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#30363D',
  },
  cardAlerte: { borderLeftWidth: 4, borderLeftColor: '#f59e0b' },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  statusDot: { width: 9, height: 9, borderRadius: 5 },
  dotOk: { backgroundColor: '#00BFA5' },
  dotAlerte: { backgroundColor: '#f59e0b' },
  dotEpuise: { backgroundColor: '#F85149' },
  cardNom: { fontSize: 16, fontWeight: '700', color: '#E6EDF3', flex: 1 },
  badge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  badgeOk: { backgroundColor: '#0d2818' },
  badgeAlerte: { backgroundColor: '#2d1f00' },
  badgeEpuise: { backgroundColor: '#2d0f0f' },
  badgeText: { fontSize: 10, fontWeight: '800' },
  badgeTextOk: { color: '#00BFA5' },
  badgeTextAlerte: { color: '#f59e0b' },
  badgeTextEpuise: { color: '#F85149' },
  qRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 8 },
  qVal: { fontSize: 32, fontWeight: '800', color: '#E6EDF3' },
  qOk: { color: '#E6EDF3' },
  qAlerte: { color: '#f59e0b' },
  qEpuise: { color: '#F85149' },
  qUnite: { fontSize: 15, color: '#8B949E', marginLeft: 4 },
  qSeuil: { fontSize: 12, color: '#484F58' },
  jauge: {
    height: 6,
    backgroundColor: '#30363D',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 12,
  },
  jaugeFill: { height: '100%', borderRadius: 3 },
  actions: { flexDirection: 'row', gap: 8 },
  actionBtn: {
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionArrivage: {
    backgroundColor: '#0d2818',
    borderWidth: 1,
    borderColor: G,
  },
  actionArrivageText: { fontSize: 13, fontWeight: '700', color: G },
  actionEdit: {
    backgroundColor: '#1C2128',
    borderWidth: 1,
    borderColor: '#388BFD',
  },
  actionEditText: { fontSize: 16 },
  actionDelete: {
    backgroundColor: '#1C2128',
    borderWidth: 1,
    borderColor: '#F85149',
  },
  actionDeleteText: { fontSize: 16 },
  actionRetirer: {
    flex: 1.5,
    backgroundColor: '#2d1f00',
    borderWidth: 1,
    borderColor: '#f59e0b',
  },
  actionRetirerText: { fontSize: 13, fontWeight: '700', color: '#f59e0b' },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 50,
  },
  emptyIcon: { fontSize: 50, marginBottom: 10 },
  emptyTitle: { fontSize: 18, color: '#E6EDF3', fontWeight: 'bold' },
  emptyDesc: { color: '#8B949E' },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: G,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
  },
  fabText: { color: '#0D1117', fontSize: 32, fontWeight: 'bold' },
});

export default StockList;
