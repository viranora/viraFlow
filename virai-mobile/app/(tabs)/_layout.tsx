import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Tabs } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { useColorScheme, Platform } from 'react-native'; // Platform eklendi
import { Ionicons } from '@expo/vector-icons';
import { TaskProvider } from '../../context/TaskContext'; 
import { GestureHandlerRootView } from 'react-native-gesture-handler';

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
              tabBarActiveTintColor: '#FFD93D',
              tabBarInactiveTintColor: '#666',
              tabBarStyle: {
                backgroundColor: '#151920',
                borderTopWidth: 1,
                borderTopColor: '#333',
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
                title: 'Akış',
                tabBarIcon: ({ color }) => <Ionicons name="flash" size={24} color={color} />,
              }}
            />

            <Tabs.Screen
              name="explore"
              options={{
                title: 'Plan',
                tabBarIcon: ({ color }) => <Ionicons name="albums" size={24} color={color} />,
              }}
            />

            <Tabs.Screen
              name="settings"
              options={{
                title: 'Ayarlar',
                tabBarIcon: ({ color }) => <Ionicons name="settings-outline" size={24} color={color} />,
              }}
            />
            
          </Tabs>
          <StatusBar style="auto" />
        </ThemeProvider>
      </TaskProvider>
    </GestureHandlerRootView>
  );
}