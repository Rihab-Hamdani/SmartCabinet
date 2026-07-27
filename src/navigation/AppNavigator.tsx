import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import WelcomeScreen from '../screens/auth/WelcomeScreen';
import CreerCompteScreen from '../screens/auth/CreerCompteScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import VerifierEmailScreen from '../screens/auth/VerifierEmailScreen';
import MotDePasseOublieScreen from '../screens/auth/MotDePasseOublieScreen';
import DashboardMedecin from '../screens/medecin/DashboardMedecin';
import DashboardSecretaire from '../screens/secretaire/DashboardSecretaire';
import StockList from '../screens/shared/StockList';
import StockForm from '../screens/shared/StockForm';
import StockDetail from '../screens/shared/StockDetail';
import StockRetirer from '../screens/shared/StockRetirer';
import StockArrivage from '../screens/shared/StockArrivage';
import PatientsScreen from '../screens/shared/PatientsScreen';
import AjouterPatientScreen from '../screens/shared/AjouterPatientScreen';
import CalendrierScreen from '../screens/shared/CalendrierScreen';
import AjouterRDVScreen from '../screens/shared/AjouterRDVScreen';
import DetailPatientScreen from '../screens/shared/DetailPatientScreen';
import AjouterConsultationScreen from '../screens/medecin/AjouterConsultationScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const StockStackSecretaire = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen
      name="StockList"
      component={StockList}
      initialParams={{ role: 'secretaire' }}
    />
    <Stack.Screen name="StockForm" component={StockForm} />
    <Stack.Screen name="StockDetail" component={StockDetail} />
    <Stack.Screen name="StockArrivage" component={StockArrivage} />
    <Stack.Screen name="StockRetirer" component={StockRetirer} />
  </Stack.Navigator>
);

const StockStackMedecin = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen
      name="StockList"
      component={StockList}
      initialParams={{ role: 'medecin' }}
    />
    <Stack.Screen name="StockDetail" component={StockDetail} />
    <Stack.Screen name="StockRetirer" component={StockRetirer} />
  </Stack.Navigator>
);

const PatientsStackSecretaire = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen
      name="PatientsList"
      component={PatientsScreen}
      initialParams={{ role: 'secretaire' }}
    />
    <Stack.Screen name="AjouterPatient" component={AjouterPatientScreen} />
    <Stack.Screen name="AjouterRDV" component={AjouterRDVScreen} />
    <Stack.Screen name="DetailPatient" component={DetailPatientScreen} />
  </Stack.Navigator>
);

const PatientsStackMedecin = () => (
  <Stack.Navigator screenOptions={{headerShown: false}}>
    <Stack.Screen name="PatientsList" component={PatientsScreen} initialParams={{role: 'medecin'}} />
    <Stack.Screen name="AjouterPatient" component={AjouterPatientScreen} />
    <Stack.Screen name="DetailPatient" component={DetailPatientScreen} />
    <Stack.Screen name="AjouterConsultation" component={AjouterConsultationScreen} />
  </Stack.Navigator>
);

const CalendrierStackSecretaire = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Calendrier" component={CalendrierScreen} initialParams={{ role: 'secretaire' }} />
    <Stack.Screen name="AjouterRDV" component={AjouterRDVScreen} />
    <Stack.Screen name="DetailPatient" component={DetailPatientScreen} />
    <Stack.Screen name="AjouterPatient" component={AjouterPatientScreen} /> 
  </Stack.Navigator>
);

const CalendrierStackMedecin = () => (
  <Stack.Navigator screenOptions={{headerShown: false}}>
    <Stack.Screen name="Calendrier" component={CalendrierScreen} initialParams={{role: 'medecin'}} />
    <Stack.Screen name="DetailPatient" component={DetailPatientScreen}/>
    <Stack.Screen name="AjouterConsultation" component={AjouterConsultationScreen} />
  </Stack.Navigator>
);

// --- TABS ---

const MedecinTabs = ({route}: any) => {
  const { onLogout } = route.params;
  return (
    <Tab.Navigator
      screenOptions={({route}) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#161B22',
          borderTopColor: '#30363D',
          height: 70,
          paddingBottom: 10,
          paddingTop: 8,
        },
        tabBarActiveTintColor: '#00BFA5',
        tabBarInactiveTintColor: '#8B949E',
        tabBarIcon: ({color}) => {
          const icons: {[k: string]: string} = { Dashboard: '🏠', Patients: '👥', RDV: '📅', Stock: '📦' };
          return <Text style={{fontSize: 20, color}}>{icons[route.name] ?? '•'}</Text>;
        },
      })}>
      <Tab.Screen name="Dashboard" component={DashboardMedecin} initialParams={{onLogout}} />
      <Tab.Screen name="Patients" component={PatientsStackMedecin} />
      <Tab.Screen name="RDV" component={CalendrierStackMedecin} />
      <Tab.Screen name="Stock" component={StockStackMedecin} />
    </Tab.Navigator>
  );
};

const SecretaireTabs = ({ route }: any) => {
  const { onLogout } = route.params;
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#161B22',
          borderTopColor: '#30363D',
          height: 70,
          paddingBottom: 10,
          paddingTop: 8,
        },
        tabBarActiveTintColor: '#1565C0',
        tabBarInactiveTintColor: '#8B949E',
        tabBarIcon: ({color}) => {
          const icons: {[k: string]: string} = { Dashboard: '🏠', Patients: '👥', RDV: '📅', Stock: '📦' };
          return <Text style={{fontSize: 20, color}}>{icons[route.name] ?? '•'}</Text>;
        },
      })}>
      <Tab.Screen name="Dashboard" component={DashboardSecretaire} initialParams={{onLogout}} />
      <Tab.Screen name="Patients" component={PatientsStackSecretaire} />
      <Tab.Screen name="RDV" component={CalendrierStackSecretaire} />
      <Tab.Screen name="Stock" component={StockStackSecretaire} />
    </Tab.Navigator>
  );
};

export default function AppNavigator() {
  const [user, setUser] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const checkUser = async () => {
      try {
        const u = await AsyncStorage.getItem('user');
        if (u) setUser(JSON.parse(u));
      } catch (e) {
        console.error("Erreur de lecture storage", e);
      } finally {
        setLoading(false);
      }
    };
    checkUser();
  }, []);

  const handleLogin = (userData: any) => setUser(userData);
  const handleLogout = async () => {
    await AsyncStorage.removeItem('user');
    setUser(null);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00BFA5" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {user ? (
        <Stack.Navigator screenOptions={{headerShown: false}}>
          {user.role === 'medecin' ? (
            <Stack.Screen 
              name="MedecinMain" 
              component={MedecinTabs} 
              initialParams={{onLogout: handleLogout}} 
            />
          ) : (
            <Stack.Screen 
              name="SecretaireMain" 
              component={SecretaireTabs} 
              initialParams={{onLogout: handleLogout}} 
            />
          )}
        </Stack.Navigator>
      ) : (
        <Stack.Navigator screenOptions={{headerShown: false}}>
          <Stack.Screen name="Welcome">
            {(props) => <WelcomeScreen {...props} onLogin={handleLogin} />}
          </Stack.Screen>
          <Stack.Screen name="CreerCompte">
            {(props) => <CreerCompteScreen {...props} onLogin={handleLogin} />}
          </Stack.Screen>
          <Stack.Screen name="Login">
            {(props) => <LoginScreen {...props} onLogin={handleLogin} />}
          </Stack.Screen>
          <Stack.Screen name="VerifierEmail" component={VerifierEmailScreen} />
          <Stack.Screen name="MotDePasseOublie" component={MotDePasseOublieScreen} />
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: '#0D1117'
  }
});