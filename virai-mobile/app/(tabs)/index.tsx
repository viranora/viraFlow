import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, Text, View, TextInput, TouchableOpacity, 
  FlatList, ActivityIndicator, KeyboardAvoidingView, Platform, ListRenderItem, Alert 
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
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
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOffline(!state.isConnected);
    });
    return () => unsubscribe();
  }, []);

  const handleAnalyze = async () => {
    if (!inputText.trim()) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (isOffline) {
      addTask(inputText, "General", "Offline");
      setInputText('');
      Alert.alert("Offline Mode", "Added as a basic task since you are offline.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: inputText }),
      });
      const data = await response.json();
      
      if (data.extracted_tasks && data.extracted_tasks.length > 0) {
        data.extracted_tasks.forEach((item: AIResponseItem) => {
          addTask(item.task, item.category, item.date);
        });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        addTask(inputText, "General", "");
      }
      setInputText(''); 
    } catch (error) {
      console.error(error);
      addTask(inputText, "General", "Backup");
      setInputText('');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Server Error", "Added as a basic task due to connection issue.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert("Delete Task", "Do you want to delete this task?", [
      { text: "Cancel" },
      { text: "Delete", onPress: () => deleteTask(id), style: 'destructive' }
    ]);
  };

  const renderTaskItem: ListRenderItem<Task> = ({ item }) => (
    <View style={[styles.card, item.completed && styles.cardCompleted]}>
      <TouchableOpacity 
        style={styles.taskContentWrapper} 
        onPress={() => toggleTaskCompletion(item.id)} 
        activeOpacity={0.7}
      >
        <View style={styles.cardIcon}>
          <Ionicons name={item.completed ? "checkbox" : "square-outline"} size={24} color={item.completed ? COLORS.accent : COLORS.primary} />
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
        <Ionicons name="trash-outline" size={20} color={COLORS.error} />
      </TouchableOpacity>
    </View>
  );

  const recentTasks = tasks.sort((a, b) => Number(b.id) - Number(a.id));

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="light" />
      
      {isOffline && (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineText}>OFFLINE MODE - AI IS DISABLED</Text>
        </View>
      )}

      <View style={styles.header}>
        <Text style={{ fontSize: 28, fontWeight: '900', color: COLORS.text, letterSpacing: 2 }}>
          VIRA<Text style={{ color: COLORS.primary }}>FLOW</Text>
        </Text>
        <Text style={styles.subtitle}>Smart Assistant & Management</Text>
      </View>

      <View style={styles.listContainer}>
        <FlatList
          data={recentTasks} renderItem={renderTaskItem} keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="create-outline" size={48} color={COLORS.card} />
              <Text style={styles.emptyText}>Dump your notes here.</Text>
            </View>
          }
        />
      </View>

      <View style={styles.inputWrapper}>
        <TextInput
          style={styles.input} placeholder={isOffline ? "Quick add task..." : "Type your notes here..."} 
          placeholderTextColor={COLORS.accent}
          value={inputText} onChangeText={setInputText} multiline
        />
        <TouchableOpacity 
          style={[styles.sendButton, isOffline && {backgroundColor: COLORS.card}]} 
          onPress={handleAnalyze} 
          disabled={loading}
        >
          {loading ? <ActivityIndicator color="#000" /> : <Ionicons name={isOffline ? "add" : "arrow-up"} size={24} color="#000" />}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  offlineBanner: { backgroundColor: COLORS.error, padding: 4, alignItems: 'center' },
  offlineText: { color: '#FFF', fontSize: 10, fontWeight: 'bold', letterSpacing: 1 },
  header: { alignItems: 'center', paddingBottom: 20, paddingTop: 10, borderBottomWidth: 1, borderBottomColor: COLORS.card },
  subtitle: { color: COLORS.accent, fontSize: 12, marginTop: 5, fontStyle: 'italic' },
  listContainer: { flex: 1, paddingHorizontal: 20, paddingTop: 10 },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', opacity: 0.5, marginTop: 50 },
  emptyText: { color: COLORS.accent, marginTop: 10, fontSize: 16 },
  card: { backgroundColor: COLORS.card, borderRadius: 12, padding: 15, marginBottom: 10, flexDirection: 'row', alignItems: 'center', borderLeftWidth: 3, borderLeftColor: COLORS.primary },
  cardCompleted: { backgroundColor: '#26221F', borderLeftColor: COLORS.accent, opacity: 0.6 },
  taskContentWrapper: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  deleteButton: { padding: 8, marginLeft: 5 },
  textCompleted: { textDecorationLine: 'line-through', color: COLORS.accent },
  cardIcon: { marginRight: 15 },
  cardContent: { flex: 1 },
  cardTitle: { color: COLORS.text, fontSize: 16, fontWeight: '500' },
  cardCategory: { color: COLORS.primary, fontSize: 12, marginTop: 4 },
  cardDate: { color: COLORS.accent, fontSize: 12, marginTop: 4, fontStyle: 'italic' },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', padding: 15, backgroundColor: COLORS.background, borderTopWidth: 1, borderTopColor: COLORS.card },
  input: { flex: 1, backgroundColor: COLORS.card, color: COLORS.text, borderRadius: 20, paddingHorizontal: 20, paddingVertical: 12, marginRight: 10, maxHeight: 100 },
  sendButton: { backgroundColor: COLORS.primary, width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center' },
});