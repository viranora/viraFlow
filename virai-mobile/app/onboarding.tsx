import React, { useState, useRef } from 'react';
import { StyleSheet, Text, View, FlatList, Dimensions, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme'; 
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

const SLIDES = [
  {
    id: '1',
    title: 'Smart AI Analysis',
    description: 'Paste your messy notes or thoughts. Our AI instantly extracts actionable tasks, categories, and deadlines.',
    icon: 'sparkles-outline'
  },
  {
    id: '2',
    title: 'Strategic Planning',
    description: 'Manage complex goals with a modern Kanban system. Organize, track, and complete tasks with ease.',
    icon: 'leaf-outline'
  }
];

export default function OnboardingScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const handleNext = async () => {
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
    } else {
      try {
        await AsyncStorage.setItem('hasSeenOnboarding', 'true');
        router.replace('/(tabs)'); 
      } catch (e) {
        console.log("Onboarding error:", e);
      }
    }
  };

  const handleSkip = async () => {
    try {
      await AsyncStorage.setItem('hasSeenOnboarding', 'true');
      router.replace('/(tabs)');
    } catch (e) {
      console.log(e);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      <View style={{ flex: 3 }}>
        <FlatList
          ref={flatListRef}
          data={SLIDES}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(e) => {
            const index = Math.round(e.nativeEvent.contentOffset.x / width);
            setCurrentIndex(index);
          }}
          renderItem={({ item }) => (
            <View style={styles.slide}>
              <View style={styles.iconContainer}>
                <Ionicons name={item.icon as any} size={100} color={COLORS.primary} />
              </View>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.description}>{item.description}</Text>
            </View>
          )}
        />
      </View>

      <View style={styles.footer}>
        <View style={styles.pagination}>
          {SLIDES.map((_, index) => (
            <View 
              key={index} 
              style={[
                styles.dot, 
                currentIndex === index ? styles.dotActive : styles.dotInactive
              ]} 
            />
          ))}
        </View>

        <View style={styles.buttonContainer}>
          {currentIndex < SLIDES.length - 1 && (
            <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
              <Text style={styles.skipText}>Skip</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.button} onPress={handleNext}>
            <Text style={styles.buttonText}>
              {currentIndex === SLIDES.length - 1 ? "LET'S START" : "NEXT"}
            </Text>
            <Ionicons 
              name={currentIndex === SLIDES.length - 1 ? "rocket-outline" : "arrow-forward"} 
              size={20} 
              color="#000" 
              style={{marginLeft: 10}}
            />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  slide: { width, alignItems: 'center', justifyContent: 'center', padding: 20 },
  iconContainer: { 
    width: 200, height: 200, borderRadius: 100, 
    backgroundColor: COLORS.card, justifyContent: 'center', alignItems: 'center',
    marginBottom: 40,
    borderWidth: 2, borderColor: '#433D35',
  },
  title: { fontSize: 32, fontWeight: 'bold', color: COLORS.text, marginBottom: 15, textAlign: 'center' },
  description: { fontSize: 16, color: COLORS.accent, textAlign: 'center', paddingHorizontal: 20, lineHeight: 24 },
  footer: { flex: 1, justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 50 },
  pagination: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  dot: { height: 10, borderRadius: 5, marginHorizontal: 5 },
  dotActive: { width: 30, backgroundColor: COLORS.primary },
  dotInactive: { width: 10, backgroundColor: COLORS.card },
  buttonContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  skipButton: { padding: 15 },
  skipText: { color: COLORS.accent, fontSize: 16 },
  button: { 
    backgroundColor: COLORS.primary, 
    height: 60, borderRadius: 30, paddingHorizontal: 30,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    marginLeft: 'auto' 
  },
  buttonText: { fontSize: 18, fontWeight: 'bold', color: '#000', letterSpacing: 1 }
});