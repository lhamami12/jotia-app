import React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import HomeScreen from '../screens/HomeScreen';
import ProfileScreen from '../screens/ProfileScreen';
import PostAdScreen from '../screens/PostAdScreen';
import MessagesScreen from '../screens/MessagesScreen';
import { colors } from '../theme/theme';
import { useTranslation } from 'react-i18next';

const Tab = createBottomTabNavigator();

const iconMap = {
  Home: 'home',
  Messages: 'chatbubble-ellipses',
  Post: 'add-circle',
  Profile: 'person',
};

export default function MainTabs({ route }) {
  const city = route.params?.city;
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.mustard,
        tabBarInactiveTintColor: 'rgba(247,243,232,.5)',
        tabBarStyle: { backgroundColor: colors.tarpDark, borderTopWidth: 0, height: 58 + insets.bottom, paddingTop: 8, paddingBottom: insets.bottom },
        tabBarIcon: ({ color, size }) => (
          <Ionicons name={iconMap[route.name]} size={size} color={color} />
        ),
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} initialParams={{ city }} options={{ tabBarLabel: t('nav.home') }} />
      <Tab.Screen name="Messages" component={MessagesScreen} options={{ tabBarLabel: t('nav.messages') }} />
      <Tab.Screen name="Post" component={PostAdScreen} initialParams={{ city }} options={{ tabBarLabel: t('nav.post') }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarLabel: t('nav.profile') }} />
    </Tab.Navigator>
  );
}
