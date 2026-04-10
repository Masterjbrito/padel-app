import React, { useRef, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Animated, Alert } from 'react-native';

import TodosScreen from './src/screens/TodosScreen';
import AndamentoScreen from './src/screens/AndamentoScreen';
import FuturosScreen from './src/screens/FuturosScreen';
import TerminadosScreen from './src/screens/TerminadosScreen';
import EstatisticasScreen from './src/screens/EstatisticasScreen';
import UtilizadoresScreen from './src/screens/UtilizadoresScreen';
import PerfilScreen from './src/screens/PerfilScreen';
import JogadorDetalheScreen from './src/screens/JogadorDetalheScreen';
import JogoDetalheScreen from './src/screens/JogoDetalheScreen';
import LoginScreen from './src/screens/LoginScreen';
import RegistoScreen from './src/screens/RegistoScreen';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { logout } from './src/services/authService';
import { colors } from './src/theme/colors';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();
const AuthStack = createNativeStackNavigator();

function HeaderLogo() {
  const spinAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(spinAnim, { toValue: 1, duration: 8000, useNativeDriver: true })
    ).start();
  }, []);

  const spin = spinAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <View style={styles.headerLogo}>
      <Animated.View style={{ transform: [{ rotate: spin }] }}>
        <Ionicons name="tennisball" size={22} color={colors.white} />
      </Animated.View>
      <Text style={styles.headerTitle}>Padel SERUL</Text>
    </View>
  );
}

function BotaoPerfil({ navigation }) {
  const { perfil } = useAuth();
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const iniciais = (perfil?.nome || '?')
    .split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();

  const ROLE_COLORS = { admin: '#7c3aed', editor: colors.primary, viewer: colors.textLight };
  const role = perfil?.role || 'viewer';
  const avatarColor = ROLE_COLORS[role] || colors.primary;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.15, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <TouchableOpacity
      style={styles.avatarBtn}
      onPress={() => navigation.navigate('Perfil')}
    >
      <Animated.View style={[styles.avatarRing, { transform: [{ scale: pulseAnim }] }]} />
      <View style={[styles.avatarMini, { backgroundColor: avatarColor }]}>
        <Text style={styles.avatarMiniText}>{iniciais}</Text>
      </View>
    </TouchableOpacity>
  );
}

function AppTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route, navigation }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          const icons = {
            Todos: focused ? 'grid' : 'grid-outline',
            'A Decorrer': focused ? 'radio-button-on' : 'radio-button-off',
            'Próximos': focused ? 'calendar' : 'calendar-outline',
            Terminados: focused ? 'checkmark-circle' : 'checkmark-circle-outline',
            Estatísticas: focused ? 'bar-chart' : 'bar-chart-outline',
          };
          return <Ionicons name={icons[route.name] || 'apps'} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textLight,
        tabBarStyle: {
          height: 60, paddingBottom: 8, paddingTop: 6,
          backgroundColor: colors.white, borderTopColor: colors.border,
        },
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
        headerStyle: { backgroundColor: colors.primary, elevation: 0, shadowOpacity: 0 },
        headerTintColor: colors.white,
        headerLeft: () => <HeaderLogo />,
        headerLeftContainerStyle: { paddingLeft: 16 },
        headerRight: () => <BotaoPerfil navigation={navigation} />,
        headerRightContainerStyle: { paddingRight: 16 },
        headerTitle: '',
      })}
    >
      <Tab.Screen name="Todos" component={TodosScreen} />
      <Tab.Screen name="A Decorrer" component={AndamentoScreen} />
      <Tab.Screen name="Próximos" component={FuturosScreen} />
      <Tab.Screen name="Terminados" component={TerminadosScreen} />
      <Tab.Screen name="Estatísticas" component={EstatisticasScreen} />
    </Tab.Navigator>
  );
}

function AppStack() {
  const handleLogout = () => {
    Alert.alert(
      'Terminar Sessão',
      'Tens a certeza que queres sair?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Sair', style: 'destructive', onPress: logout },
      ]
    );
  };

  return (
    <Stack.Navigator>
      <Stack.Screen name="Main" component={AppTabs} options={{ headerShown: false }} />
      <Stack.Screen
        name="Perfil"
        component={PerfilScreen}
        options={{
          title: 'O meu Perfil',
          headerStyle: { backgroundColor: colors.primary },
          headerTintColor: colors.white,
          headerTitleStyle: { fontWeight: '700' },
          headerRight: () => (
            <TouchableOpacity onPress={handleLogout} style={{ padding: 4 }}>
              <Ionicons name="log-out-outline" size={24} color={colors.white} />
            </TouchableOpacity>
          ),
          headerRightContainerStyle: { paddingRight: 8 },
        }}
      />
      <Stack.Screen
        name="Utilizadores"
        component={UtilizadoresScreen}
        options={{
          title: 'Gerir Utilizadores',
          headerStyle: { backgroundColor: colors.primary },
          headerTintColor: colors.white,
          headerTitleStyle: { fontWeight: '700' },
        }}
      />
      <Stack.Screen
        name="JogadorDetalhe"
        component={JogadorDetalheScreen}
        options={({ route }) => ({
          title: route.params?.nome || 'Jogador',
          headerStyle: { backgroundColor: colors.primary },
          headerTintColor: colors.white,
          headerTitleStyle: { fontWeight: '700' },
        })}
      />
      <Stack.Screen
        name="JogoDetalhe"
        component={JogoDetalheScreen}
        options={({ route }) => ({
          title: route.params?.jogo?.torneio || 'Jogo',
          headerStyle: { backgroundColor: colors.primary },
          headerTintColor: colors.white,
          headerTitleStyle: { fontWeight: '700' },
        })}
      />
    </Stack.Navigator>
  );
}

function LoginStack() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen
        name="Registo"
        component={RegistoScreen}
        options={{ animation: 'slide_from_right' }}
      />
    </AuthStack.Navigator>
  );
}

function RootNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Animated.View>
          <Ionicons name="tennisball" size={72} color={colors.white} />
        </Animated.View>
        <ActivityIndicator color={colors.white} size="large" style={{ marginTop: 24 }} />
        <Text style={styles.loadingText}>Padel SERUL</Text>
      </View>
    );
  }

  return user ? <AppStack /> : <LoginStack />;
}

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <StatusBar style="light" backgroundColor={colors.primary} />
        <RootNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  headerLogo: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { color: colors.white, fontSize: 18, fontWeight: '800', letterSpacing: 0.5 },
  avatarBtn: {
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
    width: 44, height: 44,
  },
  avatarRing: {
    position: 'absolute',
    width: 40, height: 40, borderRadius: 20,
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.4)',
  },
  avatarMini: {
    width: 34, height: 34, borderRadius: 17,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarMiniText: { color: colors.white, fontSize: 13, fontWeight: '800' },
  loadingContainer: {
    flex: 1, backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
    gap: 8,
  },
  loadingText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 8,
    letterSpacing: 1,
  },
});
