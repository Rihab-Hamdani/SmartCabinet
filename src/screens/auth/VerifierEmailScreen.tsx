import React, {useState, useEffect} from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ActivityIndicator,
} from 'react-native';
import auth from '@react-native-firebase/auth';

export default function VerifierEmailScreen({navigation, route}: any) {
  const {email} = route.params ?? {};
  const [loading, setLoading]   = useState(false);
  const [message, setMessage]   = useState('');
  const [erreur, setErreur]     = useState('');
  const [cooldown, setCooldown] = useState(0);

  // Countdown pour éviter too-many-requests
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const verifierStatut = async () => {
    setLoading(true);
    setMessage(''); setErreur('');
    try {
      const user = auth().currentUser;
      if (!user) {
        setErreur('❌ Session expirée. Reconnectez-vous.');
        return;
      }
      // Recharger l'état depuis Firebase
      await user.reload();
      const frais = auth().currentUser;
      if (frais?.emailVerified) {
        setMessage('✅ Email vérifié ! Redirection...');
        setTimeout(() => navigation.navigate('Login'), 1500);
      } else {
        setErreur(
          '⏳ Email pas encore vérifié.\n\n' +
          'Cliquez sur le lien dans votre mail puis revenez ici.'
        );
      }
    } catch (e: any) {
      setErreur(`❌ Erreur est survenue. Réessayez plus tard.`);
    } finally {
      setLoading(false);
    }
  };

  const renvoyerEmail = async () => {
    if (cooldown > 0) return;
    setLoading(true);
    setMessage(''); setErreur('');
    try {
      const user = auth().currentUser;
      if (!user) {
        setErreur('❌ Session expirée. Revenez en arrière et reconnectez-vous.');
        return;
      }
      await user.sendEmailVerification();
      setMessage('✅ Email renvoyé ! Vérifiez votre boîte mail.');
      setCooldown(60); // bloquer 60 secondes
    } catch (e: any) {
      const code = e?.code ?? '';
      if (code === 'auth/too-many-requests') {
        setErreur('❌ Trop de tentatives. Attendez quelques minutes.');
        setCooldown(120);
      } else {
        setErreur(`❌ Erreur est survenue. Réessayez plus tard. `);
      }
    } finally {
      setLoading(false);
    }
  };

  const annuler = async () => {
    try { await auth().signOut(); } catch {}
    navigation.navigate('Welcome');
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.icon}>📧</Text>
        <Text style={styles.title}>Vérifiez votre email</Text>
        <Text style={styles.desc}>Un email a été envoyé à :</Text>
        <Text style={styles.email}>{email}</Text>
        <Text style={styles.desc}>
          Ouvrez votre boîte mail, cliquez sur le lien,
          puis revenez ici et appuyez sur le bouton.
        </Text>

        {message !== '' && (
          <View style={styles.succesBox}>
            <Text style={styles.succesTxt}>{message}</Text>
          </View>
        )}
        {erreur !== '' && (
          <View style={styles.erreurBox}>
            <Text style={styles.erreurTxt}>{erreur}</Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.btnVerifier, loading && {opacity: 0.6}]}
          onPress={verifierStatut}
          disabled={loading}>
          {loading
            ? <ActivityIndicator color="#000" />
            : <Text style={styles.btnVerifierTxt}>✅ J'ai vérifié mon email</Text>
          }
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.btnRenvoyer, (loading || cooldown > 0) && {opacity: 0.5}]}
          onPress={renvoyerEmail}
          disabled={loading || cooldown > 0}>
          <Text style={styles.btnRenvoyerTxt}>
            {cooldown > 0
              ? `⏳ Renvoyer dans ${cooldown}s`
              : '📨 Renvoyer l\'email'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.btnAnnuler} onPress={annuler}>
          <Text style={styles.btnAnnulerTxt}>← Annuler et revenir</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container:      {flex:1, backgroundColor:'#0D1117', justifyContent:'center', padding:24},
  card:           {backgroundColor:'#161B22', borderRadius:24, padding:28, borderWidth:1, borderColor:'#30363D', alignItems:'center', gap:12},
  icon:           {fontSize:56, marginBottom:8},
  title:          {fontSize:22, fontWeight:'800', color:'#E6EDF3', textAlign:'center'},
  desc:           {fontSize:14, color:'#8B949E', textAlign:'center', lineHeight:22},
  email:          {fontSize:15, color:'#00BFA5', fontWeight:'700', textAlign:'center'},
  succesBox:      {width:'100%', backgroundColor:'rgba(0,191,165,0.1)', borderRadius:12, borderWidth:1, borderColor:'rgba(0,191,165,0.3)', padding:14},
  succesTxt:      {fontSize:13, color:'#00BFA5', fontWeight:'600', textAlign:'center'},
  erreurBox:      {width:'100%', backgroundColor:'rgba(255,71,87,0.1)', borderRadius:12, borderWidth:1, borderColor:'rgba(255,71,87,0.3)', padding:14},
  erreurTxt:      {fontSize:13, color:'#FF4757', textAlign:'center', lineHeight:20},
  btnVerifier:    {width:'100%', backgroundColor:'#00BFA5', borderRadius:14, padding:16, alignItems:'center', marginTop:8},
  btnVerifierTxt: {color:'#000', fontWeight:'800', fontSize:15},
  btnRenvoyer:    {width:'100%', backgroundColor:'rgba(0,191,165,0.1)', borderRadius:14, padding:14, alignItems:'center', borderWidth:1, borderColor:'rgba(0,191,165,0.3)'},
  btnRenvoyerTxt: {color:'#00BFA5', fontWeight:'600', fontSize:14},
  btnAnnuler:     {padding:12},
  btnAnnulerTxt:  {color:'#484F58', fontSize:13},
});