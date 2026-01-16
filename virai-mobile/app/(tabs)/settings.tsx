import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, Linking, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/theme'; 
import { useTasks } from '../../context/TaskContext'; 
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { userName, setUserName, clearAllData } = useTasks();
  const [nameInput, setNameInput] = useState(userName);

  const handleSaveName = () => {
    if(nameInput.trim()) {
      setUserName(nameInput);
      Alert.alert("Success", `Hello ${nameInput}, I know you now.`);
    }
  };

  const handleReset = () => {
    Alert.alert("WARNING", "All your tasks and data will be deleted. Are you sure?", [
      { text: "Cancel" },
      { text: "RESET", onPress: () => { clearAllData(); setNameInput('User'); }, style: 'destructive' }
    ]);
  };

  const openPrivacy = () => {
    Linking.openURL('https://treasure-pigeon-e11.notion.site/Vira-Flow-Gizlilik-Politikas-2e7c948b160a80a19d20f44902fb3b91'); 

  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        
        {/* IDENTITY CARD */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>IDENTITY</Text>
          <View style={styles.card}>
            <View style={styles.avatarRow}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{nameInput.charAt(0).toUpperCase()}</Text>
              </View>
              <View style={{flex: 1, marginLeft: 15}}>
                <Text style={styles.label}>What is your name?</Text>
                <TextInput 
                  style={styles.input} 
                  value={nameInput} 
                  onChangeText={setNameInput}
                  onEndEditing={handleSaveName}
                />
              </View>
            </View>
          </View>
        </View>

        {/* GENERAL SETTINGS */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>APP</Text>
          
          <TouchableOpacity style={styles.menuItem} onPress={openPrivacy}>
            <View style={{flexDirection:'row', alignItems:'center'}}>
              <Ionicons name="lock-closed-outline" size={22} color="#FFF" />
              <Text style={styles.menuText}>Privacy Policy</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <View style={{flexDirection:'row', alignItems:'center'}}>
              <Ionicons name="star-outline" size={22} color="#FFF" />
              <Text style={styles.menuText}>Rate Us</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>

           <View style={styles.menuItem}>
            <View style={{flexDirection:'row', alignItems:'center'}}>
              <Ionicons name="code-slash-outline" size={22} color="#FFF" />
              <Text style={styles.menuText}>Version</Text>
            </View>
            <Text style={{color:'#666'}}>v1.0.0</Text>
          </View>
        </View>

        {/* DANGER ZONE */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, {color: '#FF4757'}]}>DANGER ZONE</Text>
          <TouchableOpacity style={[styles.menuItem, {borderBottomWidth:0}]} onPress={handleReset}>
            <View style={{flexDirection:'row', alignItems:'center'}}>
              <Ionicons name="trash-outline" size={22} color="#FF4757" />
              <Text style={[styles.menuText, {color: '#FF4757'}]}>Reset All Data</Text>
            </View>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { padding: 20, borderBottomWidth: 1, borderBottomColor: '#333' },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#FFF' },
  content: { padding: 20 },
  section: { marginBottom: 30 },
  sectionTitle: { color: '#666', fontSize: 12, fontWeight: 'bold', marginBottom: 10, letterSpacing: 1 },
  card: { backgroundColor: '#1F2530', borderRadius: 12, padding: 15 },
  avatarRow: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: COLORS.accent, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 24, fontWeight: 'bold', color: '#000' },
  label: { color: '#888', fontSize: 12, marginBottom: 5 },
  input: { color: '#FFF', fontSize: 18, fontWeight: '500', borderBottomWidth: 1, borderBottomColor: '#444', paddingBottom: 5 },
  menuItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#1F2530', padding: 15, borderRadius: 10, marginBottom: 10 },
  menuText: { color: '#FFF', fontSize: 16, marginLeft: 15 },
});