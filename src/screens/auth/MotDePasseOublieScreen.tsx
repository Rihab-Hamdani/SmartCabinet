import React, {useState} from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
} from 'react-native';
import {reinitialiserMotDePasse, traductionErreurFirebase} from '../../services/firebase';

export default function MotDePasseOublieScreen({navigation}: any) {
  const [email, setEmail]     = useState('');
  const [loading, setLoading] = useState(false);
  const [succes, setSucces]   = useState('');
  const [erreur, setErreur]   = useState('');

  const handleEnvoyer = async () => {
    setSucces(''); setErreur('');

    if (!email.trim()) {
      setErreur('⚠️ Entrez votre adresse email.');
      return;
    }
    if (!email.includes('@') || !email.includes('.')) {
      setErreur('⚠️ Entrez un email valide (ex: nom@email.com).');
      return;
    }

    setLoading(true);
    try {
      await reinitialiserMotDePasse(email.trim());
      setSucces(
        `✅ Email envoyé à ${email.trim()} !\n\n` +
        `Consultez votre boîte mail (et le dossier Spam) ` +
        `puis cliquez sur le lien pour réinitialiser votre mot de passe.`
      );
    } catch (e: any) {
      const code = e?.code ?? '';
      if (code) {
        setErreur(traductionErreurFirebase(code));
      } else {
        setErreur(`❌ Erreur : ${e?.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>← Retour</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mot de passe oublié</Text>
        <View style={{width: 70}} />
      </View>

      <View style={styles.content}>

        {/* Icône + titre */}
        <Text style={styles.icon}>🔐</Text>
        <Text style={styles.title}>Réinitialiser le{'\n'}mot de passe</Text>
        <Text style={styles.desc}>
          Entrez l'email associé à votre compte. Nous vous enverrons un lien
          pour réinitialiser votre mot de passe.
        </Text>

        {/* Champ email */}
        <View style={styles.fieldWrap}>
          <Text style={styles.fieldLabel}>Email *</Text>
          <TextInput
            style={[styles.input, erreur && !succes ? styles.inputError : undefined]}
            placeholder="votre@email.com"
            placeholderTextColor="#484F58"
            value={email}
            onChangeText={v => { setEmail(v); setErreur(''); }}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="done"
            onSubmitEditing={handleEnvoyer}
          />
        </View>

        {/* Erreur */}
        {erreur !== '' && (
          <View style={styles.erreurBox}>
            <Text style={styles.erreurTxt}>{erreur}</Text>
          </View>
        )}

        {/* Succès */}
        {succes !== '' && (
          <View style={styles.succesBox}>
            <Text style={styles.succesTxt}>{succes}</Text>
          </View>
        )}

        {/* Bouton envoyer */}
        {succes === '' && (
          <TouchableOpacity
            style={[styles.btnEnvoyer, loading && {opacity: 0.6}]}
            onPress={handleEnvoyer}
            disabled={loading}
            activeOpacity={0.8}>
            <Text style={styles.btnEnvoyerTxt}>
              {loading ? '⏳ Envoi en cours...' : '📨 Envoyer le lien →'}
            </Text>
          </TouchableOpacity>
        )}

        {/* Bouton retour login si succès */}
        {succes !== '' && (
          <TouchableOpacity
            style={styles.btnLogin}
            onPress={() => navigation.navigate('Login')}>
            <Text style={styles.btnLoginTxt}>
              → Se connecter avec le nouveau mot de passe
            </Text>
          </TouchableOpacity>
        )}

        {/* Lien retour connexion */}
        <TouchableOpacity
          style={styles.btnRetour}
          onPress={() => navigation.navigate('Login')}>
          <Text style={styles.btnRetourTxt}>
            Retour à la connexion
          </Text>
        </TouchableOpacity>

      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container:    {flex:1, backgroundColor:'#0D1117'},
  header:       {flexDirection:'row', justifyContent:'space-between', alignItems:'center', padding:20, paddingTop:50, backgroundColor:'#161B22', borderBottomWidth:1, borderBottomColor:'#30363D'},
  back:         {color:'#00BFA5', fontSize:14, fontWeight:'600', width:70},
  headerTitle:  {fontSize:17, fontWeight:'700', color:'#E6EDF3'},
  content:      {flex:1, padding:24, alignItems:'center', justifyContent:'center'},
  icon:         {fontSize:64, marginBottom:16},
  title:        {fontSize:26, fontWeight:'800', color:'#E6EDF3', textAlign:'center', marginBottom:12, lineHeight:34},
  desc:         {fontSize:14, color:'#8B949E', textAlign:'center', lineHeight:22, marginBottom:32},
  fieldWrap:    {width:'100%', marginBottom:16},
  fieldLabel:   {fontSize:12, color:'#8B949E', marginBottom:6, fontWeight:'600'},
  input:        {backgroundColor:'#161B22', borderWidth:1, borderColor:'#30363D', borderRadius:10, padding:13, fontSize:15, color:'#E6EDF3', width:'100%'},
  inputError:   {borderColor:'#FF4757', borderWidth:1.5},
  erreurBox:    {width:'100%', backgroundColor:'rgba(255,71,87,0.08)', borderRadius:12, borderWidth:1, borderColor:'rgba(255,71,87,0.3)', padding:16, marginBottom:16},
  erreurTxt:    {fontSize:13, color:'#FF4757', lineHeight:20, textAlign:'center'},
  succesBox:    {width:'100%', backgroundColor:'rgba(0,191,165,0.08)', borderRadius:12, borderWidth:1, borderColor:'rgba(0,191,165,0.3)', padding:16, marginBottom:16},
  succesTxt:    {fontSize:13, color:'#00BFA5', lineHeight:22, textAlign:'center'},
  btnEnvoyer:   {width:'100%', backgroundColor:'#00BFA5', borderRadius:14, padding:18, alignItems:'center', marginBottom:12},
  btnEnvoyerTxt:{color:'#000', fontWeight:'800', fontSize:16},
  btnLogin:     {width:'100%', backgroundColor:'rgba(0,191,165,0.1)', borderRadius:14, padding:16, alignItems:'center', borderWidth:1, borderColor:'rgba(0,191,165,0.3)', marginBottom:12},
  btnLoginTxt:  {color:'#00BFA5', fontWeight:'600', fontSize:14},
  btnRetour:    {padding:12},
  btnRetourTxt: {color:'#484F58', fontSize:13},
});