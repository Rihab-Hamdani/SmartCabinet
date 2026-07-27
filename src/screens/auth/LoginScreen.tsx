import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { firebaseConnexion } from '../../services/firebase';
import { getUserParEmail, mettreAJourMotDePasse } from '../../database/queries';
import { getDatabase, executeInsert, executeQuery } from '../../database/database';

export default function LoginScreen({ navigation, onLogin }: any) {
  const [email, setEmail] = useState('');
  const [mdp, setMdp] = useState('');
  const [showMdp, setShowMdp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erreurEmail, setErreurEmail] = useState('');
  const [erreurMdp, setErreurMdp] = useState('');
  const [erreurGeneral, setErreurGeneral] = useState('');
  const [succes, setSucces] = useState('');

  const clearErreurs = () => {
    setErreurEmail('');
    setErreurMdp('');
    setErreurGeneral('');
    setSucces('');
  };

  const handleLogin = async () => {
    clearErreurs();

    // Validation des champs
    let hasError = false;
    if (!email.trim()) { setErreurEmail('⚠️ L\'email est obligatoire.'); hasError = true; }
    else if (!email.includes('@')) { setErreurEmail('⚠️ Email invalide.'); hasError = true; }
    if (!mdp.trim()) { setErreurMdp('⚠️ Le mot de passe est obligatoire.'); hasError = true; }
    
    if (hasError) return;

    setLoading(true);
    try {
      // 1. Initialisation silencieuse de la base de données
      await getDatabase();

      const emailNormalise = email.trim().toLowerCase();
      const mdpNormalise = mdp.trim();

      // 2. Authentification Firebase
      const authResult = await firebaseConnexion(emailNormalise, mdpNormalise);

      if (!authResult.emailVerifie) {
        setErreurGeneral('⚠️ Votre compte n\'est pas encore validé. Vérifiez vos e-mails.');
        setLoading(false);
        return;
      }

      // 3. Récupération ou création du profil local
      let user = await getUserParEmail(emailNormalise);

      if (!user) {
        // Si le profil n'existe pas localement, on le crée proprement
        await executeInsert(
          `INSERT OR IGNORE INTO users (role, nom, prenom, email, password, sexe)
           VALUES (?, ?, ?, ?, ?, ?);`,
          ['medecin', emailNormalise.split('@')[0], '', emailNormalise, mdpNormalise, 'M']
        );
        user = await getUserParEmail(emailNormalise);
      } else {
        await mettreAJourMotDePasse(emailNormalise, mdpNormalise);
      }

      if (!user) throw new Error('DB_FAILED'); // Erreur interne gérée dans le catch

      // 4. Succès
      const userData = { ...user, emailVerifie: true };
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      
      setSucces(`✅ Ravie de vous revoir !`);
      
      setTimeout(() => {
        if (typeof onLogin === 'function') onLogin(userData);
      }, 800);

    } catch (e: any) {
      // On garde les logs détaillés pour TOI dans la console (développement)
      console.log('--- ERREUR LOGIN ---', e);

      // On affiche uniquement des messages simples pour l'UTILISATEUR
      const code = e?.code ?? '';

      if (['auth/invalid-credential', 'auth/wrong-password', 'auth/user-not-found'].includes(code)) {
        setErreurGeneral('❌ Email ou mot de passe incorrect.');
      } 
      else if (code === 'auth/too-many-requests') {
        setErreurGeneral('❌ Trop de tentatives. Veuillez patienter quelques minutes.');
      } 
      else if (code === 'auth/network-request-failed') {
        setErreurGeneral('❌ Problème de connexion. Vérifiez votre Internet.');
      } 
      else {
        // Pour TOUTES les autres erreurs (SQL, bug code, etc.)
        // On affiche un message générique "propre"
        setErreurGeneral('❌ Une erreur est survenue lors de la connexion. Veuillez réessayer.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.back}>← Retour</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Connexion</Text>
          <View style={{ width: 70 }} />
        </View>

        <View style={styles.form}>
          <Text style={styles.logo}>🏥</Text>
          <Text style={styles.title}>SMART CABINET</Text>
          <Text style={styles.subtitle}>Connectez-vous à votre espace</Text>

          {/* Champ Email */}
          <View style={styles.fieldWrap}>
            <Text style={styles.fieldLabel}>Email</Text>
            <TextInput
              style={[styles.input, erreurEmail ? styles.inputError : undefined]}
              placeholder="votre@email.com"
              placeholderTextColor="#484F58"
              value={email}
              onChangeText={v => {
                setEmail(v);
                setErreurEmail('');
                setErreurGeneral('');
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
            {erreurEmail !== '' && <Text style={styles.erreurTxt}>{erreurEmail}</Text>}
          </View>

          <View style={styles.fieldWrap}>
            <Text style={styles.fieldLabel}>Mot de passe</Text>
            <View style={styles.inputRow}>
              <TextInput
                style={[
                  styles.input,
                  { flex: 1, paddingRight: 48 },
                  erreurMdp ? styles.inputError : undefined,
                ]}
                placeholder="••••••••"
                placeholderTextColor="#484F58"
                value={mdp}
                onChangeText={v => {
                  setMdp(v);
                  setErreurMdp('');
                  setErreurGeneral('');
                }}
                secureTextEntry={!showMdp}
                autoCapitalize="none"
                onSubmitEditing={handleLogin}
              />
              <TouchableOpacity
                style={styles.eyeBtn}
                onPress={() => setShowMdp(v => !v)}>
                <Text style={{ fontSize: 20 }}>{showMdp ? '🙈' : '👁️'}</Text>
              </TouchableOpacity>
            </View>
            {erreurMdp !== '' && <Text style={styles.erreurTxt}>{erreurMdp}</Text>}
          </View>

          {/* Erreurs Générales */}
          {erreurGeneral !== '' && (
            <View style={styles.erreurBox}>
              <Text style={styles.erreurBoxTxt}>{erreurGeneral}</Text>
            </View>
          )}

          {/* Succès */}
          {succes !== '' && (
            <View style={styles.succesBox}>
              <Text style={styles.succesTxt}>{succes}</Text>
            </View>
          )}

          {/* Bouton de Connexion */}
          <TouchableOpacity
            style={[styles.btnLogin, loading && { opacity: 0.7 }]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.8}>
            <Text style={styles.btnLoginTxt}>
              {loading ? '⏳ Connexion en cours...' : 'Se connecter →'}
            </Text>
          </TouchableOpacity>

          {/* Pied de page (Liens) */}
          <TouchableOpacity
            style={styles.btnOublie}
            onPress={() => navigation.navigate('MotDePasseOublie')}>
            <Text style={styles.btnOublieTxt}>🔐 Mot de passe oublié ?</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.btnCreer}
            onPress={() => navigation.navigate('CreerCompte')}>
            <Text style={styles.btnCreerTxt}>
              Pas encore de compte ? <Text style={{ color: '#00BFA5' }}>Créer un compte</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D1117' },
  scroll: { flexGrow: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 50, backgroundColor: '#161B22', borderBottomWidth: 1, borderBottomColor: '#30363D' },
  back: { color: '#00BFA5', fontSize: 14, fontWeight: '600', width: 70 },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#E6EDF3' },
  form: { padding: 24, alignItems: 'center' },
  logo: { fontSize: 56, marginTop: 20, marginBottom: 12 },
  title: { fontSize: 26, fontWeight: '800', color: '#00BFA5', letterSpacing: 3, marginBottom: 6 },
  subtitle: { fontSize: 13, color: '#484F58', marginBottom: 32, letterSpacing: 0.5 },
  fieldWrap: { width: '100%', marginBottom: 16 },
  fieldLabel: { fontSize: 12, color: '#8B949E', marginBottom: 6, fontWeight: '600' },
  inputRow: { position: 'relative', flexDirection: 'row', alignItems: 'center' },
  input: { backgroundColor: '#161B22', borderWidth: 1, borderColor: '#30363D', borderRadius: 10, padding: 13, fontSize: 15, color: '#E6EDF3', width: '100%' },
  inputError: { borderColor: '#FF4757', borderWidth: 1.5 },
  eyeBtn: { position: 'absolute', right: 12, padding: 4 },
  erreurTxt: { fontSize: 12, color: '#FF4757', marginTop: 5 },
  erreurBox: { width: '100%', backgroundColor: 'rgba(255,71,87,0.08)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,71,87,0.3)', padding: 16, marginBottom: 12 },
  erreurBoxTxt: { fontSize: 13, color: '#FF4757', textAlign: 'center' },
  succesBox: { width: '100%', backgroundColor: 'rgba(0,191,165,0.1)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(0,191,165,0.3)', padding: 16, marginBottom: 12 },
  succesTxt: { fontSize: 13, color: '#00BFA5', fontWeight: '600', textAlign: 'center' },
  btnLogin: { width: '100%', backgroundColor: '#00BFA5', borderRadius: 14, padding: 18, alignItems: 'center', marginTop: 8 },
  btnLoginTxt: { color: '#000', fontWeight: '800', fontSize: 16 },
  btnOublie: { marginTop: 15, padding: 10 },
  btnOublieTxt: { color: '#8B949E', fontSize: 13 },
  btnCreer: { marginTop: 10, padding: 12 },
  btnCreerTxt: { color: '#8B949E', fontSize: 14 },
});