import React, {useState, useCallback, useEffect} from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, RefreshControl,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useFocusEffect} from '@react-navigation/native';
import {getRDVDuJour, getStockAlertes, getTousPatients} from '../../database/queries';

export default function DashboardSecretaire({navigation, onLogout}: any) {
  const [rdv, setRdv]               = useState<any[]>([]);
  const [alertes, setAlertes]       = useState<any[]>([]);
  const [totalPatients, setTotal]   = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [user, setUser]             = useState<any>(null);

  

  useEffect(() => {
    AsyncStorage.getItem('user').then(u => {
      if (u) setUser(JSON.parse(u));
    });
  }, []);

  const charger = useCallback(async () => {
    try {
      const [r, s, p] = await Promise.all([
        getRDVDuJour(), getStockAlertes(), getTousPatients(),
      ]);
      setRdv(r); setAlertes(s); setTotal(p.length);
    } catch (e) { console.error(e); }
  }, []);

  useFocusEffect(useCallback(() => { charger(); }, [charger]));

  const onRefresh = async () => {
    setRefreshing(true);
    await charger();
    setRefreshing(false);
  };

  const logout = async () => {
    await AsyncStorage.removeItem('user');
    onLogout();
  };

  const couleurStatut = (s: string) =>
    s === 'confirmé' ? '#00BFA5' : s === 'annulé' ? '#FF4757' : '#FFA502';

  // Civilité et emoji selon sexe
  const estFemme = user?.sexe === 'F';
  const civilite = estFemme ? 'Mme' : 'M.';
  const emoji    = estFemme ? '👩‍💼' : '👨‍💼';

  // Date du jour
  const dateAujourdhui = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long',
  });

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor="#1565C0"
        />
      }>

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.avatar}>
            <Text style={styles.avatarEmoji}>{emoji}</Text>
          </View>
          <View style={{flex: 1}}>
            <Text style={styles.headerRole}>Secrétaire</Text>
            <Text style={styles.headerNom} numberOfLines={1}>
              {civilite} {user?.prenom ?? ''} {user?.nom ?? ''}
            </Text>
            <Text style={styles.date}>{dateAujourdhui}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Text style={styles.logoutTxt}>Déconn.</Text>
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={[styles.stat, {borderColor: '#1565C0'}]}>
          <Text style={styles.statEmoji}>📅</Text>
          <Text style={[styles.statVal, {color: '#1565C0'}]}>{rdv.length}</Text>
          <Text style={styles.statLbl}>RDV{'\n'}AUJOURD'HUI</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statEmoji}>👥</Text>
          <Text style={styles.statVal}>{totalPatients}</Text>
          <Text style={styles.statLbl}>PATIENTS{'\n'}TOTAL</Text>
        </View>
        <View style={[styles.stat, {
          borderColor: alertes.length > 0 ? '#FF4757' : '#30363D',
        }]}>
          <Text style={styles.statEmoji}>🚨</Text>
          <Text style={[styles.statVal, {
            color: alertes.length > 0 ? '#FF4757' : '#E6EDF3',
          }]}>
            {alertes.length}
          </Text>
          <Text style={styles.statLbl}>ALERTES{'\n'}STOCK</Text>
        </View>
      </View>

      {/* Alerte stock */}
      {alertes.length > 0 && (
        <View style={styles.alertBanner}>
          <View style={styles.alertDot} />
          <Text style={styles.alertTxt}>
            {alertes.length} article(s) en stock bas
          </Text>
        </View>
      )}

      {/* RDV du jour */}
      <View style={styles.section}>
        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitre}>📅 RDV DU JOUR</Text>
          <TouchableOpacity onPress={() => navigation.navigate('RDV')}>
            <Text style={styles.lienAjout}>+ Ajouter</Text>
          </TouchableOpacity>
        </View>

        {rdv.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTxt}>Aucun RDV aujourd'hui</Text>
          </View>
        ) : (
          rdv.map((r: any) => (
            <View
              key={r.id}
              style={[styles.rdvCard, {borderLeftColor: couleurStatut(r.statut)}]}>
              <Text style={styles.rdvHeure}>
                {new Date(r.date_heure).toLocaleTimeString('fr-FR', {
                  hour: '2-digit', minute: '2-digit',
                })}
              </Text>
              <View style={styles.rdvInfo}>
                <Text style={styles.rdvNom}>{r.prenom} {r.nom}</Text>
                <Text style={styles.rdvMotif}>{r.motif || '—'}</Text>
              </View>
              <View style={[styles.badge,
                {backgroundColor: couleurStatut(r.statut) + '20'}]}>
                <Text style={[styles.badgeTxt,
                  {color: couleurStatut(r.statut)}]}>
                  {r.statut}
                </Text>
              </View>
            </View>
          ))
        )}
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:    {flex:1, backgroundColor:'#0D1117'},
  header:       {flexDirection:'row', justifyContent:'space-between', alignItems:'center', padding:20, paddingTop:50, backgroundColor:'#161B22', borderBottomWidth:1, borderBottomColor:'#30363D'},
  headerLeft:   {flexDirection:'row', alignItems:'center', gap:12, flex:1},
  avatar:       {width:52, height:52, borderRadius:26, backgroundColor:'rgba(21,101,192,0.15)', justifyContent:'center', alignItems:'center', borderWidth:2, borderColor:'rgba(21,101,192,0.4)'},
  avatarEmoji:  {fontSize:28},
  headerRole:   {fontSize:10, color:'#1565C0', letterSpacing:2, fontWeight:'700', marginBottom:2},
  headerNom:    {fontSize:17, fontWeight:'800', color:'#E6EDF3'},
  date:         {fontSize:11, color:'#8B949E', marginTop:2},
  logoutBtn:    {padding:8, backgroundColor:'rgba(255,71,87,0.1)', borderRadius:8, borderWidth:1, borderColor:'rgba(255,71,87,0.3)', marginLeft:8},
  logoutTxt:    {color:'#FF4757', fontSize:12, fontWeight:'600'},
  statsRow:     {flexDirection:'row', gap:10, padding:16},
  stat:         {flex:1, backgroundColor:'#161B22', borderRadius:14, borderWidth:1, borderColor:'#30363D', padding:12, alignItems:'center', gap:4},
  statEmoji:    {fontSize:18},
  statVal:      {fontSize:22, fontWeight:'800', color:'#E6EDF3'},
  statLbl:      {fontSize:8, color:'#8B949E', letterSpacing:1, textAlign:'center'},
  alertBanner:  {flexDirection:'row', alignItems:'center', gap:10, margin:16, marginTop:0, padding:14, backgroundColor:'rgba(255,71,87,0.1)', borderRadius:12, borderWidth:1, borderColor:'rgba(255,71,87,0.3)'},
  alertDot:     {width:8, height:8, borderRadius:4, backgroundColor:'#FF4757'},
  alertTxt:     {flex:1, fontSize:13, color:'#FF4757'},
  section:      {padding:16, paddingTop:8},
  sectionRow:   {flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:12},
  sectionTitre: {fontSize:11, fontWeight:'700', color:'#8B949E', letterSpacing:1.5},
  lienAjout:    {fontSize:13, fontWeight:'600', color:'#1565C0'},
  empty:        {padding:24, alignItems:'center', backgroundColor:'#161B22', borderRadius:12},
  emptyTxt:     {color:'#8B949E', fontSize:14},
  rdvCard:      {flexDirection:'row', alignItems:'center', gap:12, backgroundColor:'#161B22', borderRadius:12, borderWidth:1, borderColor:'#30363D', borderLeftWidth:4, padding:14, marginBottom:8},
  rdvHeure:     {fontSize:13, fontWeight:'700', color:'#E6EDF3', width:44},
  rdvInfo:      {flex:1},
  rdvNom:       {fontSize:14, fontWeight:'600', color:'#E6EDF3'},
  rdvMotif:     {fontSize:12, color:'#8B949E', marginTop:2},
  badge:        {paddingHorizontal:8, paddingVertical:3, borderRadius:20},
  badgeTxt:     {fontSize:10, fontWeight:'700'},
});