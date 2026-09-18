import './src/i18n';
import React, { useState, useEffect } from 'react';
import { View, Text, Alert } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import RegionScreen from './src/screens/RegionScreen';
import CityScreen from './src/screens/CityScreen';
import MainTabs from './src/navigation/MainTabs';
import SettingsScreen from './src/screens/SettingsScreen';
import PrivacyScreen from './src/screens/PrivacyScreen';
import ListingDetailScreen from './src/screens/ListingDetailScreen';
import LoginScreen from './src/screens/LoginScreen';
import VerifyScreen from './src/screens/VerifyScreen';
import ChatScreen from './src/screens/ChatScreen';
import AboutScreen from './src/screens/AboutScreen';
import ContactScreen from './src/screens/ContactScreen';
import MyListingsScreen from './src/screens/MyListingsScreen';
import EditListingScreen from './src/screens/EditListingScreen';
import ReportListingScreen from './src/screens/ReportListingScreen';
import AdminReportsScreen from './src/screens/AdminReportsScreen';
import AdminUsersScreen from './src/screens/AdminUsersScreen';
import RateSellerScreen from './src/screens/RateSellerScreen';
import FavoritesScreen from './src/screens/FavoritesScreen';
import { AuthProvider } from './src/context/AuthContext';
import { colors } from './src/theme/theme';

const Stack = createNativeStackNavigator();

if (global.ErrorUtils) {
  const defaultHandler = global.ErrorUtils.getGlobalHandler();
  global.ErrorUtils.setGlobalHandler((error, isFatal) => {
    Alert.alert(isFatal ? 'خطأ فادح' : 'خطأ', String(error && error.message ? error.message : error));
  });
}

class ErrorBoundary extends React.Component {
  state = { error: null };
  static getDerivedStateFromError(error) { return { error }; }
  render() {
    if (this.state.error) {
      return (
        <View style={{ flex: 1, backgroundColor: '#fff', padding: 20, paddingTop: 60 }}>
          <Text style={{ fontWeight: '900', fontSize: 16, marginBottom: 10 }}>وقع خطأ:</Text>
          <Text selectable style={{ fontSize: 13, color: 'red' }}>{String(this.state.error && this.state.error.message)}</Text>
        </View>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const [loading, setLoading] = useState(true);
  const [savedCity, setSavedCity] = useState(null);

  useEffect(() => {
    AsyncStorage.getItem('selectedCity').then((city) => {
      setSavedCity(city);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return <View style={{ flex: 1, backgroundColor: colors.tarp }} />;
  }

  return (
    <SafeAreaProvider>
    <ErrorBoundary>
      <AuthProvider>
        <NavigationContainer>
          <StatusBar style="light" />
          <Stack.Navigator
            screenOptions={{ headerShown: false }}
            initialRouteName={savedCity ? 'MainTabs' : 'Region'}
          >
            <Stack.Screen name="Region" component={RegionScreen} />
            <Stack.Screen name="City" component={CityScreen} />
            <Stack.Screen name="MainTabs" component={MainTabs} initialParams={{ city: savedCity }} />
            <Stack.Screen name="ListingDetail" component={ListingDetailScreen} options={{ presentation: 'modal' }} />
            <Stack.Screen name="Login" component={LoginScreen} options={{ presentation: 'modal' }} />
            <Stack.Screen name="Verify" component={VerifyScreen} options={{ presentation: 'modal' }} />
            <Stack.Screen name="Chat" component={ChatScreen} options={{ presentation: 'modal' }} />
            <Stack.Screen name="About" component={AboutScreen} options={{ presentation: 'modal' }} />
            <Stack.Screen name="Contact" component={ContactScreen} options={{ presentation: 'modal' }} />
<Stack.Screen name="MyListings" component={MyListingsScreen} options={{ presentation: 'modal' }} />
<Stack.Screen name="EditListing" component={EditListingScreen} options={{ presentation: 'modal' }} />          
<Stack.Screen name="ReportListing" component={ReportListingScreen} options={{ presentation: 'modal' }} />
            <Stack.Screen name="AdminReports" component={AdminReportsScreen} options={{ presentation: 'modal' }} />
            <Stack.Screen name="AdminUsers" component={AdminUsersScreen} options={{ presentation: 'modal' }} />
            <Stack.Screen name="RateSeller" component={RateSellerScreen} options={{ presentation: 'modal' }} />
            <Stack.Screen name="Favorites" component={FavoritesScreen} options={{ presentation: 'modal' }} />
            <Stack.Screen name="Settings" component={SettingsScreen} options={{ presentation: 'modal' }} />
            <Stack.Screen name="Privacy" component={PrivacyScreen} options={{ presentation: 'modal' }} />
</Stack.Navigator>
        </NavigationContainer>
      </AuthProvider>
    </ErrorBoundary>
    </SafeAreaProvider>
  );
}

