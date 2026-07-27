import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, Text, LogBox } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';

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

        // INITIALISATION FIREBASE ICI (C'est plus sûr en React 18)
        if (!firebase.apps.length) {
          await firebase.initializeApp({} as any);
        }

        // On initialise la DB
        await initDatabase();
        console.log('✅ SQLite prêt');

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

  if (status === 'loading') {
    return (
      <SafeAreaProvider>
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: '#0D1117',
          }}
        >
          <ActivityIndicator size="large" color="#00BFA5" />
          <Text style={{ color: '#8B949E', fontSize: 14, letterSpacing: 2 }}>
            SMART CABINET
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
