import React, { useState } from 'react';
import { 
  StyleSheet, Text, View, Image, TextInput, TouchableOpacity, 
  FlatList, ActivityIndicator, KeyboardAvoidingView, Platform, ListRenderItem, Alert 
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { COLORS } from '../../constants/theme'; 
import { useTasks, Task } from '../../context/TaskContext'; 
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import NetInfo from '@react-native-community/netinfo';

interface AIResponseItem {
  task: string;
  category: string;
  date: string;
}

export default function App() {
  const insets = useSafeAreaInsets();
  const API_URL = 'https://viraflow.onrender.com/analyze-mixed'; 
  const { tasks, addTask, toggleTaskCompletion, deleteTask } = useTasks(); 
  
  const [inputText, setInputText] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) { alert("İzin lazım!"); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, quality: 0.5, base64: true,
    });
    if (!result.canceled && result.assets) {
      setSelectedImage('data:image/jpeg;base64,' + result.assets[0].base64);
    }
  };

  const handleAnalyze = async () => {
    if (!inputText.trim() && !selectedImage) return;

    const state = await NetInfo.fetch();
    if (!state.isConnected) {
      Alert.alert("Bağlantı Hatası", "İnternet bağlantın yok gibi görünüyor. Yapay zeka çevrimdışı çalışamaz.");
      return;
    }
    // --------------------------------

    setLoading(true);
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: inputText, image_base64: selectedImage }),
      });
      const data = await response.json();
      
      if (data.extracted_tasks) {
        data.extracted_tasks.forEach((item: AIResponseItem) => {
          addTask(item.task, item.category, item.date);
        });
      }
      setInputText(''); 
      setSelectedImage(null);
    } catch (error) {
      console.error(error);
      Alert.alert("Sunucu Hatası", "Beyne ulaşamadım. Backend çalışıyor mu?");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert("Görevi Sil", "Bu görevi silmek istiyor musun?", [
      { text: "Vazgeç" },
      { text: "Sil", onPress: () => deleteTask(id), style: 'destructive' }
    ]);
  };

  const renderTaskItem: ListRenderItem<Task> = ({ item }) => (
    <View style={[styles.card, item.completed && styles.cardCompleted]}>
      <TouchableOpacity style={styles.taskContentWrapper} onPress={() => toggleTaskCompletion(item.id)} activeOpacity={0.7}>
        <View style={styles.cardIcon}>
          <Ionicons name={item.completed ? "checkbox" : "square-outline"} size={24} color={item.completed ? "#888" : COLORS.primary} />
        </View>
        <View style={styles.cardContent}>
          <Text style={[styles.cardTitle, item.completed && styles.textCompleted]}>{item.title}</Text>
          <View style={{flexDirection: 'row'}}>
            <Text style={styles.cardCategory}>{item.category}</Text>
            {item.date ? <Text style={styles.cardDate}> • {item.date}</Text> : null}
          </View>
        </View>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.deleteButton}>
        <Ionicons name="trash-outline" size={20} color="#FF4757" />
      </TouchableOpacity>
    </View>
  );

  const recentTasks = tasks.sort((a, b) => Number(b.id) - Number(a.id));

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <Text style={{ fontSize: 28, fontWeight: '900', color: '#FFF', letterSpacing: 2 }}>
          VIRA<Text style={{ color: COLORS.accent }}>FLOW</Text>
        </Text>
        <Text style={styles.subtitle}>Akıllı Asistan & Yönetim</Text>
      </View>
      <View style={styles.listContainer}>
        <FlatList
          data={recentTasks} renderItem={renderTaskItem} keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="camera-outline" size={48} color={COLORS.card} />
              <Text style={styles.emptyText}>Notlarını buraya dök.</Text>
            </View>
          }
        />
      </View>
      <View style={styles.inputWrapper}>
        <TouchableOpacity onPress={pickImage} style={styles.iconButton}>
           <Ionicons name="image-outline" size={24} color={selectedImage ? COLORS.accent : "#888"} />
        </TouchableOpacity>
        <TextInput
          style={styles.input} placeholder="Yaz veya fotoğraf ekle..." placeholderTextColor="#666"
          value={inputText} onChangeText={setInputText} multiline
        />
        <TouchableOpacity style={styles.sendButton} onPress={handleAnalyze} disabled={loading}>
          {loading ? <ActivityIndicator color="#000" /> : <Ionicons name="arrow-up" size={24} color="#000" />}
        </TouchableOpacity>
      </View>
      {selectedImage && (
        <View style={styles.previewContainer}>
          <Image source={{ uri: selectedImage }} style={styles.previewImage} />
          <TouchableOpacity onPress={() => setSelectedImage(null)} style={styles.removeImage}>
            <Ionicons name="close-circle" size={24} color="red" />
          </TouchableOpacity>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { alignItems: 'center', paddingBottom: 20, paddingTop: 10, borderBottomWidth: 1, borderBottomColor: COLORS.card },
  logo: { width: 120, height: 40, resizeMode: 'contain' },
  subtitle: { color: '#888', fontSize: 12, marginTop: 5, fontStyle: 'italic' },
  listContainer: { flex: 1, paddingHorizontal: 20, paddingTop: 10 },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', opacity: 0.5, marginTop: 50 },
  emptyText: { color: '#888', marginTop: 10, fontSize: 16 },
  card: { backgroundColor: COLORS.card, borderRadius: 12, padding: 15, marginBottom: 10, flexDirection: 'row', alignItems: 'center', borderLeftWidth: 3, borderLeftColor: COLORS.primary },
  cardCompleted: { backgroundColor: '#1A1F26', borderLeftColor: '#444', opacity: 0.6 },
  taskContentWrapper: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  deleteButton: { padding: 8, marginLeft: 5 },
  textCompleted: { textDecorationLine: 'line-through', color: '#666' },
  cardIcon: { marginRight: 15 },
  cardContent: { flex: 1 },
  cardTitle: { color: COLORS.text, fontSize: 16, fontWeight: '500' },
  cardCategory: { color: COLORS.primary, fontSize: 12, marginTop: 4 },
  cardDate: { color: '#888', fontSize: 12, marginTop: 4, fontStyle: 'italic' },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', padding: 15, backgroundColor: '#151920', borderTopWidth: 1, borderTopColor: COLORS.card },
  iconButton: { marginRight: 10, padding: 5 },
  input: { flex: 1, backgroundColor: COLORS.card, color: COLORS.text, borderRadius: 20, paddingHorizontal: 20, paddingVertical: 12, marginRight: 10, maxHeight: 100 },
  sendButton: { backgroundColor: COLORS.accent, width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center' },
  previewContainer: { position: 'absolute', bottom: 90, left: 20, zIndex: 10 },
  previewImage: { width: 80, height: 80, borderRadius: 10, borderWidth: 2, borderColor: COLORS.accent },
  removeImage: { position: 'absolute', top: -10, right: -10, backgroundColor: '#fff', borderRadius: 12 }
});