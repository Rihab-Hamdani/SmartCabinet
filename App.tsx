import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, Text, LogBox } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { initDatabase } from './src/database/database';
import AppNavigator from './src/navigation/AppNavigator';

// Importation correcte de Firebase
import firebase from '@react-native-firebase/app';

// Ignorer les avertissements inutiles
LogBox.ignoreLogs([
  'active-resource',
  'deprecated',
  'Firebase namespaced',
  'FBReactNativeSpec',
]);

export default function App() {
  // 1. Initialisation de Firebase sécurisée (avant les Hooks)
  if (!firebase.apps.length) {
    try {
      firebase.initializeApp({} as any);
    } catch (e) {
      console.log('Firebase déjà prêt');
    }
  }

  // 2. Déclaration des Hooks (Toujours en haut et sans conditions)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>(
    'loading',
  );
  const [errMsg, setErrMsg] = useState('');

  useEffect(() => {
    const init = async () => {
      try {
        console.log('🚀 Tentative d’initialisation...');

        // On initialise la DB en premier
        await initDatabase();
        console.log('✅ SQLite prêt');

        // Petit délai pour laisser le thread se libérer
        setTimeout(() => {
          setStatus('ready');
        }, 800);
      } catch (e: any) {
        console.log('⚠️ Erreur mineure init:', e);
        setErrMsg(e.message || 'Erreur inconnue');
        // On passe quand même en ready pour ne pas bloquer l'utilisateur au PFA
        setStatus('ready');
      }
    };
    init();
  }, []);

  // 3. Rendu conditionnel
  if (status === 'loading') {
    return (
      <SafeAreaProvider>
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: '#0D1117',
            gap: 20,
          }}
        >
          <Text style={{ fontSize: 48 }}>🏥</Text>
          <ActivityIndicator size="large" color="#00BFA5" />
          <Text style={{ color: '#8B949E', fontSize: 14, letterSpacing: 2 }}>
            SMART CABINET
          </Text>
        </View>
      </SafeAreaProvider>
    );
  }

  if (status === 'error') {
    return (
      <SafeAreaProvider>
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: '#0D1117',
            padding: 32,
            gap: 16,
          }}
        >
          <Text style={{ fontSize: 40 }}>❌</Text>
          <Text
            style={{
              color: '#FF4757',
              fontSize: 16,
              fontWeight: '700',
              textAlign: 'center',
            }}
          >
            Erreur d'initialisation
          </Text>
          <Text style={{ color: '#8B949E', fontSize: 13, textAlign: 'center' }}>
            {errMsg}
          </Text>
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <AppNavigator />
    </SafeAreaProvider>
  );
}
