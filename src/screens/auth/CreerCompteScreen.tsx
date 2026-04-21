import React, {useState, useRef} from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { firebaseCreerCompte, traductionErreurFirebase } from '../../services/firebase';
import { executeInsert, getDatabase } from '../../database/database';

type Role = 'medecin' | 'secretaire';

interface Erreurs {
  nom?: string;
  prenom?: string;
  email?: string;
  mdp?: string;
  mdpConfirm?: string;
  general?: string;
}

export default function CreerCompteScreen({navigation}: any) {

  const [role, setRole]                     = useState<Role>('medecin');
  const [sexe, setSexe]                     = useState<'M' | 'F'>('M');
  const [nom, setNom]                       = useState('');
  const [prenom, setPrenom]                 = useState('');
  const [email, setEmail]                   = useState('');
  const [mdp, setMdp]                       = useState('');
  const [mdpConfirm, setMdpConfirm]         = useState('');
  const [loading, setLoading]               = useState(false);
  const [showMdp, setShowMdp]               = useState(false);
  const [showMdpConfirm, setShowMdpConfirm] = useState(false);
  const [erreurs, setErreurs]               = useState<Erreurs>({});
  const [succes, setSucces]                 = useState('');

  const prenomRef  = useRef<TextInput>(null);
  const emailRef   = useRef<TextInput>(null);
  const mdpRef     = useRef<TextInput>(null);
  const mdpConfRef = useRef<TextInput>(null);

  const changerRole = (nouveauRole: Role) => {
    setRole(nouveauRole);
    setNom(''); setPrenom(''); setEmail('');
    setMdp(''); setMdpConfirm('');
    setSexe('M');
    setErreurs({}); setSucces('');
  };

  const clearErreur = (champ: keyof Erreurs) => {
    setErreurs(prev => ({...prev, [champ]: undefined, general: undefined}));
    setSucces('');
  };

  const validerChamp = (champ: keyof Erreurs, valeur: string) => {
    let msg = '';
    switch (champ) {
      case 'nom':
        if (!valeur.trim()) msg = '⚠️ Le nom est obligatoire.';
        else if (valeur.trim().length < 2) msg = '⚠️ Le nom doit avoir au moins 2 caractères.';
        break;
      case 'prenom':
        if (!valeur.trim()) msg = '⚠️ Le prénom est obligatoire.';
        else if (valeur.trim().length < 2) msg = '⚠️ Le prénom doit avoir au moins 2 caractères.';
        break;
      case 'email':
        if (!valeur.trim()) msg = '⚠️ L\'email est obligatoire.';
        else if (!valeur.includes('@')) msg = '⚠️ Il manque le "@" dans l\'email.';
        else if (!valeur.includes('.')) msg = '⚠️ L\'email semble invalide (ex: nom@email.com).';
        break;
      case 'mdp':
        if (!valeur) msg = '⚠️ Le mot de passe est obligatoire.';
        else if (valeur.length < 6) msg = `⚠️ Encore ${6 - valeur.length} caractère(s) minimum.`;
        break;
      case 'mdpConfirm':
        if (!valeur) msg = '⚠️ Confirmez votre mot de passe.';
        else if (valeur !== mdp) msg = '⚠️ Les mots de passe ne correspondent pas.';
        break;
    }
    if (msg) setErreurs(prev => ({...prev, [champ]: msg}));
    else     setErreurs(prev => ({...prev, [champ]: undefined}));
  };

  const toutValider = (): boolean => {
    const e: Erreurs = {};
    if (!nom.trim() || nom.trim().length < 2)
      e.nom = '⚠️ Le nom est obligatoire (min. 2 caractères).';
    if (!prenom.trim() || prenom.trim().length < 2)
      e.prenom = '⚠️ Le prénom est obligatoire (min. 2 caractères).';
    if (!email.trim() || !email.includes('@') || !email.includes('.'))
      e.email = '⚠️ Entrez un email valide (ex: nom@email.com).';
    if (mdp.length < 6)
      e.mdp = `⚠️ Mot de passe trop court (${mdp.length}/6 caractères minimum).`;
    if (mdp !== mdpConfirm)
      e.mdpConfirm = '⚠️ Les mots de passe ne correspondent pas.';
    setErreurs(e);
    return Object.keys(e).length === 0;
  };

  const handleCreer = async () => {
    setSucces('');
    if (!toutValider()) return;
    setLoading(true);

    try {
      // 0. S'assurer que la base est prête
      await getDatabase();

      const emailNormalise = email.trim().toLowerCase();

      // 1. Firebase
      await firebaseCreerCompte(emailNormalise, mdp);

      // 2. SQLite
      await executeInsert(
        `INSERT OR REPLACE INTO users (role, nom, prenom, email, password, sexe)
         VALUES (?, ?, ?, ?, ?, ?);`,
        [role, nom.trim(), prenom.trim(), emailNormalise, mdp, sexe]
      );

      setSucces(`✅ Compte créé ! Vérifiez votre email.`);
      setTimeout(() => {
        navigation.navigate('Login');
      }, 1500);

    } catch (e: any) {
      const code = e?.code ?? '';
      console.log('🔥 Erreur création:', code, e?.message);
      setErreurs({ general: traductionErreurFirebase(code) });
    } finally {
      setLoading(false);
    }
  };

  const forceMotDePasse = () => {
    if (!mdp) return null;
    const fort  = mdp.length >= 12 && /[A-Z]/.test(mdp) && /[0-9]/.test(mdp);
    const moyen = mdp.length >= 8;
    const force   = fort ? 'Fort' : moyen ? 'Moyen' : 'Faible';
    const couleur = fort ? '#00BFA5' : moyen ? '#FFA502' : '#FF4757';
    const largeur = fort ? '100%' : moyen ? '60%' : '30%';
    return (
      <View style={styles.forceWrap}>
        <View style={styles.forceBarre}>
          <View style={[styles.forceRempli, {width: largeur as any, backgroundColor: couleur}]} />
        </View>
        <Text style={[styles.forceTxt, {color: couleur}]}>Force : {force}</Text>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>

        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.back}>← Retour</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Créer un compte</Text>
          <View style={{width: 70}} />
        </View>

        <View style={styles.form}>
          <Text style={styles.sectionLabel}>VOTRE RÔLE</Text>
          <View style={styles.rolesRow}>
            <TouchableOpacity
              style={[styles.roleCard, styles.roleMed,
                role === 'medecin' && styles.roleActiveMed]}
              onPress={() => changerRole('medecin')}>
              <Text style={styles.roleEmoji}>👨‍⚕️</Text>
              <Text style={[styles.roleNom, {color: '#00BFA5'}]}>MÉDECIN</Text>
              <Text style={styles.roleDesc}>Accès complet</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.roleCard, styles.roleSec,
                role === 'secretaire' && styles.roleActiveSec]}
              onPress={() => changerRole('secretaire')}>
              <Text style={styles.roleEmoji}>👩‍💼</Text>
              <Text style={[styles.roleNom, {color: '#1565C0'}]}>SECRÉTAIRE</Text>
              <Text style={styles.roleDesc}>Accès administratif</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionLabel}>INFORMATIONS PERSONNELLES</Text>

          <View style={styles.fieldWrap}>
            <Text style={styles.fieldLabel}>Sexe</Text>
            <View style={styles.sexeRow}>
              {([
                {label: '👨 Masculin', val: 'M' as const},
                {label: '👩 Féminin',  val: 'F' as const},
              ]).map(s => (
                <TouchableOpacity
                  key={s.val}
                  style={[styles.sexeBtn, sexe === s.val && styles.sexeBtnActive]}
                  onPress={() => setSexe(s.val)}>
                  <Text style={[styles.sexeBtnTxt, sexe === s.val && {color: '#00BFA5'}]}>
                    {s.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.fieldWrap}>
            <Text style={styles.fieldLabel}>Nom *</Text>
            <TextInput
              style={[styles.input, erreurs.nom && styles.inputError]}
              placeholder="Ex: Mansouri"
              placeholderTextColor="#484F58"
              value={nom}
              onChangeText={v => { setNom(v); clearErreur('nom'); }}
              onBlur={() => validerChamp('nom', nom)}
              autoCapitalize="words"
              autoCorrect={false}
              returnKeyType="next"
              onSubmitEditing={() => prenomRef.current?.focus()}
            />
            {erreurs.nom && <Text style={styles.erreurTxt}>{erreurs.nom}</Text>}
          </View>

          <View style={styles.fieldWrap}>
            <Text style={styles.fieldLabel}>Prénom *</Text>
            <TextInput
              ref={prenomRef}
              style={[styles.input, erreurs.prenom && styles.inputError]}
              placeholder="Ex: Karim"
              placeholderTextColor="#484F58"
              value={prenom}
              onChangeText={v => { setPrenom(v); clearErreur('prenom'); }}
              onBlur={() => validerChamp('prenom', prenom)}
              autoCapitalize="words"
              autoCorrect={false}
              returnKeyType="next"
              onSubmitEditing={() => emailRef.current?.focus()}
            />
            {erreurs.prenom && <Text style={styles.erreurTxt}>{erreurs.prenom}</Text>}
          </View>

          <View style={styles.fieldWrap}>
            <Text style={styles.fieldLabel}>Email *</Text>
            <TextInput
              ref={emailRef}
              style={[styles.input, erreurs.email && styles.inputError]}
              placeholder="Ex: karim@cabinet.com"
              placeholderTextColor="#484F58"
              value={email}
              onChangeText={v => { setEmail(v); clearErreur('email'); }}
              onBlur={() => validerChamp('email', email)}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
              onSubmitEditing={() => mdpRef.current?.focus()}
            />
            {erreurs.email && <Text style={styles.erreurTxt}>{erreurs.email}</Text>}
          </View>

          <Text style={styles.sectionLabel}>SÉCURITÉ</Text>

          <View style={styles.fieldWrap}>
            <Text style={styles.fieldLabel}>Mot de passe * (min. 6 caractères)</Text>
            <View style={styles.inputRow}>
              <TextInput
                ref={mdpRef}
                style={[styles.input, {flex:1, paddingRight:48},
                  erreurs.mdp && styles.inputError]}
                placeholder="••••••••"
                placeholderTextColor="#484F58"
                value={mdp}
                onChangeText={v => { setMdp(v); clearErreur('mdp'); }}
                onBlur={() => validerChamp('mdp', mdp)}
                secureTextEntry={!showMdp}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
                onSubmitEditing={() => mdpConfRef.current?.focus()}
              />
              <TouchableOpacity
                style={styles.eyeBtn}
                onPress={() => setShowMdp(v => !v)}>
                <Text style={{fontSize:20}}>{showMdp ? '🙈' : '👁️'}</Text>
              </TouchableOpacity>
            </View>
            {mdp.length > 0 && forceMotDePasse()}
            {erreurs.mdp && <Text style={styles.erreurTxt}>{erreurs.mdp}</Text>}
          </View>

          <View style={styles.fieldWrap}>
            <Text style={styles.fieldLabel}>Confirmer le mot de passe *</Text>
            <View style={styles.inputRow}>
              <TextInput
                ref={mdpConfRef}
                style={[styles.input, {flex:1, paddingRight:48},
                  erreurs.mdpConfirm && styles.inputError]}
                placeholder="••••••••"
                placeholderTextColor="#484F58"
                value={mdpConfirm}
                onChangeText={v => { setMdpConfirm(v); clearErreur('mdpConfirm'); }}
                onBlur={() => validerChamp('mdpConfirm', mdpConfirm)}
                secureTextEntry={!showMdpConfirm}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="done"
                onSubmitEditing={handleCreer}
              />
              <TouchableOpacity
                style={styles.eyeBtn}
                onPress={() => setShowMdpConfirm(v => !v)}>
                <Text style={{fontSize:20}}>{showMdpConfirm ? '🙈' : '👁️'}</Text>
              </TouchableOpacity>
            </View>
            {mdpConfirm.length > 0 && mdp === mdpConfirm && (
              <Text style={styles.okTxt}>✅ Les mots de passe correspondent</Text>
            )}
            {erreurs.mdpConfirm && <Text style={styles.erreurTxt}>{erreurs.mdpConfirm}</Text>}
          </View>

          {erreurs.general && (
            <View style={styles.erreurGenerale}>
              <Text style={styles.erreurGeneraleTxt}>{erreurs.general}</Text>
            </View>
          )}

          {succes !== '' && (
            <View style={styles.succesBox}>
              <Text style={styles.succesTxt}>{succes}</Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.btnCreer, loading && styles.btnDisabled]}
            onPress={handleCreer}
            disabled={loading}>
            <Text style={styles.btnCreerTxt}>
              {loading ? '⏳ Création en cours...' : '✨ Créer mon compte →'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.btnLogin}
            onPress={() => navigation.navigate('Login')}>
            <Text style={styles.btnLoginTxt}>
              Déjà un compte ? Se connecter
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container:        {flex:1, backgroundColor:'#0D1117'},
  scroll:           {flexGrow:1},
  header:           {flexDirection:'row', justifyContent:'space-between', alignItems:'center', padding:20, paddingTop:50, backgroundColor:'#161B22', borderBottomWidth:1, borderBottomColor:'#30363D'},
  back:             {color:'#00BFA5', fontSize:14, fontWeight:'600', width:70},
  headerTitle:      {fontSize:17, fontWeight:'700', color:'#E6EDF3'},
  form:             {padding:20},
  sectionLabel:     {fontSize:10, color:'#484F58', letterSpacing:2, marginTop:20, marginBottom:12},
  rolesRow:         {flexDirection:'row', gap:12, marginBottom:8},
  roleCard:         {flex:1, padding:16, borderRadius:16, borderWidth:1.5, alignItems:'center', gap:4},
  roleMed:          {backgroundColor:'rgba(0,191,165,0.08)', borderColor:'rgba(0,191,165,0.3)'},
  roleSec:          {backgroundColor:'rgba(21,101,192,0.08)', borderColor:'rgba(21,101,192,0.3)'},
  roleActiveMed:    {borderColor:'#00BFA5', backgroundColor:'rgba(0,191,165,0.18)'},
  roleActiveSec:    {borderColor:'#1565C0', backgroundColor:'rgba(21,101,192,0.18)'},
  roleEmoji:        {fontSize:28},
  roleNom:          {fontSize:11, fontWeight:'700', letterSpacing:1},
  roleDesc:         {fontSize:10, color:'#484F58'},
  sexeRow:          {flexDirection:'row', gap:10},
  sexeBtn:          {flex:1, padding:12, borderRadius:10, borderWidth:1, borderColor:'#30363D', backgroundColor:'#161B22', alignItems:'center'},
  sexeBtnActive:    {borderColor:'#00BFA5', backgroundColor:'rgba(0,191,165,0.1)'},
  sexeBtnTxt:       {fontSize:13, color:'#8B949E', fontWeight:'600'},
  fieldWrap:        {marginBottom:16},
  fieldLabel:       {fontSize:12, color:'#8B949E', marginBottom:6, fontWeight:'600'},
  inputRow:         {position:'relative', flexDirection:'row', alignItems:'center'},
  input:            {backgroundColor:'#161B22', borderWidth:1, borderColor:'#30363D', borderRadius:10, padding:13, fontSize:15, color:'#E6EDF3'},
  inputError:       {borderColor:'#FF4757', borderWidth:1.5},
  eyeBtn:           {position:'absolute', right:12, padding:4},
  erreurWrap:       {marginTop:6},
  erreurTxt:        {fontSize:12, color:'#FF4757', marginTop:5},
  erreurLien:       {fontSize:12, color:'#00BFA5', marginTop:4, fontWeight:'600'},
  erreurGenerale:   {backgroundColor:'rgba(255,71,87,0.1)', borderRadius:10, borderWidth:1, borderColor:'rgba(255,71,87,0.3)', padding:14, marginBottom:12},
  erreurGeneraleTxt:{fontSize:13, color:'#FF4757', lineHeight:20},
  okTxt:            {fontSize:12, color:'#00BFA5', marginTop:5},
  succesBox:        {backgroundColor:'rgba(0,191,165,0.1)', borderRadius:10, borderWidth:1, borderColor:'rgba(0,191,165,0.3)', padding:14, marginBottom:12},
  succesTxt:        {fontSize:13, color:'#00BFA5', fontWeight:'600', textAlign:'center'},
  forceWrap:        {flexDirection:'row', alignItems:'center', gap:8, marginTop:6},
  forceBarre:       {flex:1, height:4, backgroundColor:'#30363D', borderRadius:4},
  forceRempli:      {height:4, borderRadius:4},
  forceTxt:         {fontSize:11, fontWeight:'600'},
  btnCreer:         {marginTop:24, backgroundColor:'#00BFA5', borderRadius:14, padding:18, alignItems:'center'},
  btnDisabled:      {opacity:0.5},
  btnCreerTxt:      {color:'#000', fontWeight:'800', fontSize:16},
  btnLogin:         {marginTop:14, alignItems:'center', padding:12},
  btnLoginTxt:      {color:'#8B949E', fontSize:14},
});