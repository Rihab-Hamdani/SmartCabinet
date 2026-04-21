import React, {useState, useCallback, useEffect} from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, RefreshControl,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useFocusEffect} from '@react-navigation/native';
import {getRDVDuJour, getStockAlertes} from '../../database/queries';

export default function DashboardMedecin({navigation, onLogout}: any) {
  const [rdv, setRdv]           = useState<any[]>([]);
  const [alertes, setAlertes]   = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [user, setUser]         = useState<any>(null);

  const dateAujourdhui = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  useEffect(() => {
    AsyncStorage.getItem('user').then(u => {
      if (u) setUser(JSON.parse(u));
    });
  }, []);

  const charger = useCallback(async () => {
    try {
      const [r, s] = await Promise.all([getRDVDuJour(), getStockAlertes()]);
      setRdv(r);
      setAlertes(s);
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

  // Emoji selon sexe
  const emoji = user?.sexe === 'F' ? '👩‍⚕️' : '👨‍⚕️';

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor="#00BFA5"
        />
      }>

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.avatar}>
            <Text style={styles.avatarEmoji}>{emoji}</Text>
          </View>
          <View style={{flex: 1}}>
            <Text style={styles.headerRole}>Médecin</Text>
            <Text style={styles.headerNom} numberOfLines={1}>
              Dr. {user?.prenom ?? ''} {user?.nom ?? ''}
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
        <View style={[styles.stat, {borderColor: '#00BFA5'}]}>
          <Text style={styles.statEmoji}>👥</Text>
          <Text style={[styles.statVal, {color: '#00BFA5'}]}>{rdv.length}</Text>
          <Text style={styles.statLbl}>PATIENTS{'\n'}AUJOURD'HUI</Text>
        </View>
        <View style={[styles.stat, {
          borderColor: alertes.length > 0 ? '#FF4757' : '#30363D',
        }]}>
          <Text style={styles.statEmoji}>📦</Text>
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
            Stock bas : {alertes.map((a: any) => a.nom).join(', ')}
          </Text>
        </View>
      )}

      {/* RDV du jour */}
      <View style={styles.section}>
        <Text style={styles.sectionTitre}>📅 RDV DU JOUR</Text>
        {rdv.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTxt}>Aucun rendez-vous aujourd'hui</Text>
          </View>
        ) : (
          rdv.map((r: any) => (
            <View key={r.id} style={styles.rdvCard}>
              <View style={styles.rdvAvatar}>
                <Text style={styles.rdvAvatarTxt}>
                  {((r.nom?.[0] ?? '') + (r.prenom?.[0] ?? '')).toUpperCase()}
                </Text>
              </View>
              <View style={styles.rdvInfo}>
                <Text style={styles.rdvNom}>{r.prenom} {r.nom}</Text>
                <Text style={styles.rdvMotif}>{r.motif || 'Consultation'}</Text>
              </View>
              <Text style={styles.rdvHeure}>
                {new Date(r.date_heure).toLocaleTimeString('fr-FR', {
                  hour: '2-digit', minute: '2-digit',
                })}
              </Text>
            </View>
          ))
        )}
      </View>

      {/* Accès rapide */}
      <View style={styles.section}>
        <Text style={styles.sectionTitre}>⚡ ACCÈS RAPIDE</Text>
        <View style={styles.quickRow}>
          {[
            {label: 'Patients', emoji: '👥', screen: 'Patients'},
            {label: 'RDV',      emoji: '📅', screen: 'RDV'},
            {label: 'Stock',    emoji: '📦', screen: 'Stock'},
          ].map(item => (
            <TouchableOpacity
              key={item.screen}
              style={styles.quickBtn}
              onPress={() => navigation.navigate(item.screen)}>
              <Text style={styles.quickEmoji}>{item.emoji}</Text>
              <Text style={styles.quickLbl}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:    {flex:1, backgroundColor:'#0D1117'},
  header:       {flexDirection:'row', justifyContent:'space-between', alignItems:'center', padding:20, paddingTop:50, backgroundColor:'#161B22', borderBottomWidth:1, borderBottomColor:'#30363D'},
  headerLeft:   {flexDirection:'row', alignItems:'center', gap:12, flex:1},
  avatar:       {width:52, height:52, borderRadius:26, backgroundColor:'rgba(0,191,165,0.15)', justifyContent:'center', alignItems:'center', borderWidth:2, borderColor:'rgba(0,191,165,0.4)'},
  avatarEmoji:  {fontSize:28},
  headerRole:   {fontSize:10, color:'#00BFA5', letterSpacing:2, fontWeight:'700', marginBottom:2},
  headerNom:    {fontSize:17, fontWeight:'800', color:'#E6EDF3'},
  date:         {fontSize:11, color:'#8B949E', marginTop:2},
  logoutBtn:    {padding:8, backgroundColor:'rgba(255,71,87,0.1)', borderRadius:8, borderWidth:1, borderColor:'rgba(255,71,87,0.3)', marginLeft:8},
  logoutTxt:    {color:'#FF4757', fontSize:12, fontWeight:'600'},
  statsRow:     {flexDirection:'row', gap:12, padding:16},
  stat:         {flex:1, backgroundColor:'#161B22', borderRadius:16, borderWidth:1, padding:16, alignItems:'center', gap:4},
  statEmoji:    {fontSize:22},
  statVal:      {fontSize:28, fontWeight:'800'},
  statLbl:      {fontSize:9, color:'#8B949E', letterSpacing:1, textAlign:'center'},
  alertBanner:  {flexDirection:'row', alignItems:'center', gap:10, margin:16, marginTop:0, padding:14, backgroundColor:'rgba(255,71,87,0.1)', borderRadius:12, borderWidth:1, borderColor:'rgba(255,71,87,0.3)'},
  alertDot:     {width:8, height:8, borderRadius:4, backgroundColor:'#FF4757'},
  alertTxt:     {flex:1, fontSize:13, color:'#FF4757'},
  section:      {padding:16, paddingTop:8},
  sectionTitre: {fontSize:11, fontWeight:'700', color:'#8B949E', letterSpacing:1.5, marginBottom:12},
  empty:        {padding:24, alignItems:'center', backgroundColor:'#161B22', borderRadius:12},
  emptyTxt:     {color:'#8B949E', fontSize:14},
  rdvCard:      {flexDirection:'row', alignItems:'center', gap:12, backgroundColor:'#161B22', borderRadius:12, borderWidth:1, borderColor:'#30363D', padding:14, marginBottom:8},
  rdvAvatar:    {width:40, height:40, borderRadius:20, backgroundColor:'rgba(0,191,165,0.15)', justifyContent:'center', alignItems:'center'},
  rdvAvatarTxt: {color:'#00BFA5', fontWeight:'700', fontSize:14},
  rdvInfo:      {flex:1},
  rdvNom:       {fontSize:14, fontWeight:'600', color:'#E6EDF3'},
  rdvMotif:     {fontSize:12, color:'#8B949E', marginTop:2},
  rdvHeure:     {fontSize:13, fontWeight:'700', color:'#E6EDF3'},
  quickRow:     {flexDirection:'row', gap:10, marginTop:8},
  quickBtn:     {flex:1, backgroundColor:'#161B22', borderRadius:12, borderWidth:1, borderColor:'#30363D', padding:16, alignItems:'center', gap:6},
  quickEmoji:   {fontSize:24},
  quickLbl:     {fontSize:11, color:'#8B949E', fontWeight:'600'},
});