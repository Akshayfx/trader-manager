/**
 * Main Tab Navigator
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/FontAwesome5';

import { useThemeStore, colors } from '../store/themeStore';

// Screens
import HomeScreen from '../screens/HomeScreen';
import PositionsScreen from '../screens/PositionsScreen';
import NewsScreen from '../screens/NewsScreen';
import AIAnalysisScreen from '../screens/AIAnalysisScreen';
import SettingsScreen from '../screens/SettingsScreen';

const Tab = createBottomTabNavigator();

const MainTabNavigator: React.FC = () => {
  const { theme } = useThemeStore();
  const themeColors = colors[theme];

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: string;

          switch (route.name) {
            case 'Home':
              iconName = 'home';
              break;
            case 'Positions':
              iconName = 'chart-line';
              break;
            case 'News':
              iconName = 'newspaper';
              break;
            case 'AI':
              iconName = 'brain';
              break;
            case 'Settings':
              iconName = 'cog';
              break;
            default:
              iconName = 'circle';
          }

          return (
            <View style={[styles.iconContainer, focused && styles.activeIconContainer]}>
              <Icon name={iconName} size={size - 4} color={color} />
            </View>
          );
        },
        tabBarActiveTintColor: themeColors.primary,
        tabBarInactiveTintColor: themeColors.textMuted,
        tabBarStyle: {
          backgroundColor: themeColors.bgSecondary,
          borderTopWidth: 1,
          borderTopColor: themeColors.border,
          height: 70,
          paddingBottom: 10,
          paddingTop: 10,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 4,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Positions" component={PositionsScreen} />
      <Tab.Screen name="News" component={NewsScreen} />
      <Tab.Screen name="AI" component={AIAnalysisScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  iconContainer: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
  },
  activeIconContainer: {
    backgroundColor: 'rgba(0, 212, 255, 0.1)',
  },
});

export default MainTabNavigator;
