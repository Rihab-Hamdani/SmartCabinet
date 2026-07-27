import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
} from 'react-native';

export default function WelcomeScreen({ navigation, onLogin }: any) {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0D1117" />

      {/* Logo */}
      <View style={styles.logoWrap}>
        <Text style={styles.logoEmoji}>🏥</Text>
      </View>
      <Text style={styles.title}>MedFlow</Text>
      <Text style={styles.subtitle}>Gestion de Cabinet Médical</Text>
      <Text style={styles.desc}>
        Application sécurisée et 100% locale pour numériser votre cabinet
        médical.
      </Text>

      {/* Boutons */}
      <View style={styles.btnsWrap}>
        <TouchableOpacity
          style={styles.btnPrimary}
          onPress={() => navigation.navigate('CreerCompte')}
        >
          <Text style={styles.btnPrimaryTxt}>✨ Créer un compte</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.btnSecondary}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.btnSecondaryTxt}>Se connecter</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D1117',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  logoWrap: {
    width: 100,
    height: 100,
    borderRadius: 30,
    backgroundColor: '#00BFA5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    elevation: 12,
    shadowColor: '#00BFA5',
    shadowOpacity: 0.4,
    shadowRadius: 20,
  },
  logoEmoji: { fontSize: 50 },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#00BFA5',
    letterSpacing: 3,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#8B949E',
    letterSpacing: 1,
    marginBottom: 20,
    textAlign: 'center',
  },
  desc: {
    fontSize: 13,
    color: '#484F58',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 48,
    paddingHorizontal: 16,
  },
  btnsWrap: { width: '100%', gap: 12 },
  btnPrimary: {
    backgroundColor: '#00BFA5',
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
    elevation: 4,
  },
  btnPrimaryTxt: {
    color: '#000',
    fontWeight: '800',
    fontSize: 16,
    letterSpacing: 0.5,
  },
  btnSecondary: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#30363D',
  },
  btnSecondaryTxt: { color: '#E6EDF3', fontWeight: '600', fontSize: 16 },
  footer: {
    marginTop: 40,
    fontSize: 11,
    color: '#484F58',
    textAlign: 'center',
  },
});
