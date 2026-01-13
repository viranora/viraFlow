import { Redirect } from 'expo-router';
import { useState, useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Gatekeeper() {
  const [isFirstLaunch, setIsFirstLaunch] = useState<boolean | null>(null);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const hasSeen = await AsyncStorage.getItem('hasSeenOnboarding');

        setIsFirstLaunch(hasSeen !== 'true');
      } catch (e) {
        setIsFirstLaunch(false); 
      }
    };

    checkStatus();
  }, []);

  if (isFirstLaunch === null) {
    return (
      <View style={{ flex: 1, backgroundColor: '#151920', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#FFD93D" />
      </View>
    );
  }

  return <Redirect href={isFirstLaunch ? "/onboarding" : "/(tabs)"} />;
}