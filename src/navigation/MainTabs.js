import React from 'react';
import { View, Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeScreen from '../screens/HomeScreen';
import ProfileScreen from '../screens/ProfileScreen';
import PostAdScreen from '../screens/PostAdScreen';
import MessagesScreen from '../screens/MessagesScreen';
import { colors } from '../theme/theme';

const Tab = createBottomTabNavigator();

function PlaceholderScreen({ label }) {
  return (
    <View style={{ flex: 1, backgroundColor: colors.tarp, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: colors.paper, fontSize: 16, fontWeight: '700' }}>{label}</Text>
    </View>
  );
}

export default function MainTabs({ route }) {
  const city = route.params?.city;

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.mustard,
        tabBarInactiveTintColor: 'rgba(247,243,232,.5)',
        tabBarStyle: { backgroundColor: colors.tarpDark, borderTopWidth: 0, height: 78, paddingTop: 8 },
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} initialParams={{ city }} options={{ tabBarLabel: 'الرئيسية' }} />
      <Tab.Screen name="Messages" component={MessagesScreen} options={{ tabBarLabel: 'الرسائل' }} />
      <Tab.Screen name="Post" component={PostAdScreen} initialParams={{ city }} options={{ tabBarLabel: 'نشر إعلان' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarLabel: 'حسابي' }} />
    </Tab.Navigator>
  );
}
