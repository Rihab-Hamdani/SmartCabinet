import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, Text, LogBox } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import { initDatabase } from './src/database/database'; // 👈 AJOUTE CET IMPORT

LogBox.ignoreLogs([
  'active-resource',
  'deprecated',
  'Firebase',
  'FBReactNativeSpec',
]);

export default function App() {
  const [status, setStatus] = useState<'loading' | 'ready'>('loading');

  useEffect(() => {
    const init = async () => {
      try {
        console.log('🚀 Initialisation de SQLite...');
        await initDatabase(); // 👈 ON FORCE LA CRÉATION DES TABLES ICI

        await new Promise(resolve => setTimeout(resolve, 800));
        setStatus('ready');
      } catch (e) {
        console.error('❌ Échec du démarrage de la base de données :', e);
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
          <Text style={{ color: '#8B949E', fontSize: 14, marginTop: 10 }}>
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
