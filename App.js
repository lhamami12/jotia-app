import React from 'react';
import { View, Text, Alert } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import RegionScreen from './src/screens/RegionScreen';
import CityScreen from './src/screens/CityScreen';
import MainTabs from './src/navigation/MainTabs';
import ListingDetailScreen from './src/screens/ListingDetailScreen';
import LoginScreen from './src/screens/LoginScreen';
import VerifyScreen from './src/screens/VerifyScreen';
import ChatScreen from './src/screens/ChatScreen';
import { AuthProvider } from './src/context/AuthContext';

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
  return (
    <ErrorBoundary>
      <AuthProvider>
        <NavigationContainer>
          <StatusBar style="light" />
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Region" component={RegionScreen} />
            <Stack.Screen name="City" component={CityScreen} />
            <Stack.Screen name="MainTabs" component={MainTabs} />
            <Stack.Screen name="ListingDetail" component={ListingDetailScreen} options={{ presentation: 'modal' }} />
            <Stack.Screen name="Login" component={LoginScreen} options={{ presentation: 'modal' }} />
            <Stack.Screen name="Verify" component={VerifyScreen} options={{ presentation: 'modal' }} />
            <Stack.Screen name="Chat" component={ChatScreen} options={{ presentation: 'modal' }} />
          </Stack.Navigator>
        </NavigationContainer>
      </AuthProvider>
    </ErrorBoundary>
  );
}
