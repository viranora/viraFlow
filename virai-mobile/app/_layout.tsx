import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { useColorScheme } from 'react-native'; 
import { TaskProvider } from '../context/TaskContext'; 
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as Sentry from '@sentry/react-native';
import Constants from 'expo-constants';

SplashScreen.preventAutoHideAsync();

// Sentry Başlatma
Sentry.init({
  dsn: Constants.expoConfig?.extra?.sentryDsn, // app.json'dan DSN'i çeker
  debug: __DEV__, // Sadece geliştirme modunda konsola log basar
  tracesSampleRate: 1.0, // Hata takip oranı
});

export default function RootLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <TaskProvider>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <Stack screenOptions={{ headerShown: false }}>

            <Stack.Screen name="index" /> 
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="onboarding" options={{ animation: 'fade' }} />
            <Stack.Screen name="+not-found" />
          </Stack>
          <StatusBar style="auto" />
        </ThemeProvider>
      </TaskProvider>
    </GestureHandlerRootView>
  );
}