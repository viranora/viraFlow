import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Tabs } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { useColorScheme, Platform } from 'react-native'; 
import { Ionicons } from '@expo/vector-icons';
import { TaskProvider } from '../../context/TaskContext'; 
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { COLORS } from '../../constants/theme';

SplashScreen.preventAutoHideAsync();

export default function TabLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <TaskProvider>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <Tabs
            screenOptions={{
              tabBarActiveTintColor: COLORS.primary,
              tabBarInactiveTintColor: COLORS.accent,
              tabBarStyle: {
                backgroundColor: COLORS.background,
                borderTopWidth: 1,
                borderTopColor: COLORS.card,
                height: Platform.OS === 'ios' ? 90 : 70, 
                paddingBottom: Platform.OS === 'ios' ? 30 : 10,
                paddingTop: 10,
                elevation: 0, 
              },
              headerShown: false,
              tabBarLabelStyle: {
                fontSize: 12,
                fontWeight: 'bold',
                marginTop: 2
              }
            }}>
            
            <Tabs.Screen
              name="index"
              options={{
                title: 'Flow',
                tabBarIcon: ({ color }) => <Ionicons name="leaf-outline" size={24} color={color} />,
              }}
            />

            <Tabs.Screen
              name="explore"
              options={{
                title: 'Plan',
                tabBarIcon: ({ color }) => <Ionicons name="layers-outline" size={24} color={color} />,
              }}
            />

            <Tabs.Screen
              name="settings"
              options={{
                title: 'Settings',
                tabBarIcon: ({ color }) => <Ionicons name="options-outline" size={24} color={color} />,
              }}
            />
            
          </Tabs>
          <StatusBar style="light" />
        </ThemeProvider>
      </TaskProvider>
    </GestureHandlerRootView>
  );
}