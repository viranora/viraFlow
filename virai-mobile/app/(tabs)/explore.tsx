import React, { useRef, useState, useMemo } from 'react';
import { 
  StyleSheet, Text, View, ScrollView, Dimensions, 
  PanResponder, Animated, TouchableOpacity, Modal, TextInput, Alert, ActivityIndicator, 
  KeyboardAvoidingView, Platform 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/theme'; 
import { useTasks, Task } from '../../context/TaskContext'; 
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PieChart } from 'react-native-chart-kit';
import NetInfo from '@react-native-community/netinfo';

const { width } = Dimensions.get('window');
const COLUMN_WIDTH = width * 0.8; 
const API_URL_COACH = 'https://viraflow.onrender.com/coach-me';
const API_URL_DECOMPOSE = 'https://viraflow.onrender.com/decompose-task';

// --- KART BİLEŞENİ ---
const DraggableCard = ({ task, onMove, onDelete, onSplit, onEdit }: any) => {
  const pan = useRef(new Animated.ValueXY()).current;
  const [isDragging, setIsDragging] = useState(false);
  const [loadingSplit, setLoadingSplit] = useState(false);

  const handleSplitPress = async () => {
    setLoadingSplit(true);
    await onSplit(task);
    setLoadingSplit(false);
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        setIsDragging(true);
        pan.setOffset({ x: (pan.x as any)._value, y: (pan.y as any)._value });
      },
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], { useNativeDriver: false }),
      onPanResponderRelease: (e, gestureState) => {
        setIsDragging(false);
        pan.flattenOffset();
        if (gestureState.dx > 120) {
          Animated.timing(pan, { toValue: { x: 500, y: 0 }, duration: 200, useNativeDriver: false }).start(() => onMove('next'));
        } else if (gestureState.dx < -120) {
          Animated.timing(pan, { toValue: { x: -500, y: 0 }, duration: 200, useNativeDriver: false }).start(() => onMove('prev'));
        } else {
          Animated.spring(pan, { toValue: { x: 0, y: 0 }, friction: 5, useNativeDriver: false }).start();
        }
      }
    })
  ).current;

  const getBorderColor = () => {
    switch(task.status) {
      case 'todo': return '#FF6B6B';
      case 'in-progress': return '#FFD93D';
      case 'done': return '#6BCB77';
      default: return '#FFF';
    }
  };

  return (
    <Animated.View
      style={{ transform: [{ translateX: pan.x }, { translateY: pan.y }], zIndex: isDragging ? 999 : 1, opacity: isDragging ? 0.9 : 1 }}
      {...panResponder.panHandlers}
    >
      <View style={[styles.card, { borderLeftColor: getBorderColor() }]}>
        <View style={styles.cardHeader}>
          <View style={{flexDirection:'row', alignItems:'center', flex: 1}}>
             <Text style={[styles.tag, { color: getBorderColor() }]}>#{task.category}</Text>
             {task.date ? <Text style={styles.dateTag}>📅 {task.date}</Text> : null}
          </View>
          
          {/* DÜZELTME 1: Butonlar arası boşluk ve daha büyük tıklama alanı */}
          <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
            <TouchableOpacity onPress={() => onEdit(task)} style={styles.iconBtn}>
              <Ionicons name="pencil" size={16} color={COLORS.text} />
            </TouchableOpacity>

            <TouchableOpacity onPress={handleSplitPress} style={styles.iconBtn} disabled={loadingSplit}>
              {loadingSplit ? 
                <ActivityIndicator size="small" color={COLORS.accent} /> : 
                <Ionicons name="git-network" size={16} color={COLORS.accent} />
              }
            </TouchableOpacity>

            <TouchableOpacity onPress={() => onDelete(task.id)} style={styles.iconBtn}>
              <Ionicons name="trash" size={16} color="#FF6B6B" />
            </TouchableOpacity>
          </View>
        </View>
        <Text style={styles.cardTitle}>{task.title}</Text>
        <View style={styles.dragHint}>
          <Ionicons name="arrow-back" size={12} color="#444" />
          <Text style={styles.hintText}>Sürükle</Text>
          <Ionicons name="arrow-forward" size={12} color="#444" />
        </View>
      </View>
    </Animated.View>
  );
};

export default function KanbanScreen() {
  const insets = useSafeAreaInsets();
  const { tasks, updateTaskStatus, deleteTask, addTask, editTask } = useTasks();
  
  const [modalVisible, setModalVisible] = useState(false);
  const [statsVisible, setStatsVisible] = useState(false);
  const [titleInput, setTitleInput] = useState('');
  const [categoryInput, setCategoryInput] = useState('');
  const [dateInput, setDateInput] = useState('');
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [coachLoading, setCoachLoading] = useState(false);
  const [coachAdvice, setCoachAdvice] = useState<string | null>(null);

  const chartData = useMemo(() => {
    const categoryCounts: { [key: string]: number } = {};
    tasks.forEach(task => {
      const cat = task.category || 'Genel';
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    });
    const colors = ['#FF6B6B', '#FFD93D', '#6BCB77', '#4D96FF', '#9B59B6'];
    return Object.keys(categoryCounts).map((key, index) => ({
      name: key, population: categoryCounts[key], color: colors[index % colors.length], legendFontColor: "#FFF", legendFontSize: 12
    }));
  }, [tasks]);

  const completedCount = tasks.filter(t => t.status === 'done').length;
  const totalCount = tasks.length;
  const progressRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const handleMoveTask = (task: Task, direction: 'next' | 'prev') => {
    let nextStatus: Task['status'] = task.status;
    if (direction === 'next') {
      if (task.status === 'todo') nextStatus = 'in-progress';
      else if (task.status === 'in-progress') nextStatus = 'done';
    } else {
      if (task.status === 'done') nextStatus = 'in-progress';
      else if (task.status === 'in-progress') nextStatus = 'todo';
    }
    if (nextStatus !== task.status) updateTaskStatus(task.id, nextStatus);
  };

  const handleDelete = (id: string) => {
    Alert.alert("Sil", "Emin misin?", [{ text: "Vazgeç" }, { text: "Sil", onPress: () => deleteTask(id), style: 'destructive' }]);
  };

  const handleSplitTask = async (task: Task) => {
    const state = await NetInfo.fetch();
    if (!state.isConnected) { Alert.alert("Bağlantı Yok", "İnternet lazım."); return; }

    try {
      const response = await fetch(API_URL_DECOMPOSE, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ main_task: task.title, category: task.category })
      });
      const data = await response.json();
      if (data.extracted_tasks && data.extracted_tasks.length > 0) {
        data.extracted_tasks.forEach((sub: any) => addTask(sub.task, sub.category, sub.date));
        Alert.alert("Başarılı", `'${task.title}' görevi parçalandı!`);
      } else { Alert.alert("Hata", "Parçalanamadı."); }
    } catch { Alert.alert("Hata", "Sunucu hatası."); }
  };

  const openAddModal = () => {
    setEditingTask(null); setTitleInput(''); setCategoryInput(''); setDateInput(''); setModalVisible(true);
  };

  const openEditModal = (task: Task) => {
    setEditingTask(task); setTitleInput(task.title); setCategoryInput(task.category); setDateInput(task.date || ''); setModalVisible(true);
  };

  const handleSave = () => {
    if(!titleInput.trim()) return alert("Boş görev olmaz.");
    if (editingTask) editTask(editingTask.id, titleInput, categoryInput || 'Genel', dateInput);
    else addTask(titleInput, categoryInput || 'Genel', dateInput);
    setModalVisible(false);
  };

  const handleCoachMe = async () => {
    const state = await NetInfo.fetch();
    if (!state.isConnected) { Alert.alert("Bağlantı Yok", "Koçun çevrimdışı."); return; }

    setCoachLoading(true); setCoachAdvice(null);
    try {
      const payload = { tasks: tasks.map(t => ({ title: t.title, status: t.status, category: t.category })) };
      const response = await fetch(API_URL_COACH, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
      });
      const data = await response.json();
      setCoachAdvice(data.advice);
    } catch { Alert.alert("Hata", "Koç meşgul."); } finally { setCoachLoading(false); }
  };

  const renderColumn = (title: string, status: Task['status'], color: string) => {
    const columnTasks = tasks.filter(t => t.status === status);
    return (
      <View style={styles.column}>
        <View style={[styles.columnHeader, { borderLeftColor: color }]}>
          <Text style={styles.columnTitle}>{title}</Text>
          <View style={[styles.badge, { backgroundColor: color }]}>
            <Text style={styles.badgeText}>{columnTasks.length}</Text>
          </View>
        </View>
        <ScrollView style={styles.columnScroll} showsVerticalScrollIndicator={false}>
          {columnTasks.map(task => (
            <DraggableCard 
              key={task.id} task={task} 
              onMove={(dir: any) => handleMoveTask(task, dir)} 
              onDelete={handleDelete}
              onSplit={handleSplitTask} 
              onEdit={openEditModal}
            />
          ))}
        </ScrollView>
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {coachAdvice && (
        <View style={styles.adviceContainer}>
          <View style={styles.adviceHeader}>
            <Ionicons name="nuclear" size={20} color="#FF6B6B" />
            <Text style={styles.adviceTitle}>GERÇEKLER</Text>
          </View>
          <Text style={styles.adviceText}>{coachAdvice}</Text>
          <TouchableOpacity onPress={() => setCoachAdvice(null)} style={styles.closeAdvice}><Ionicons name="close" size={20} color="#FFF" /></TouchableOpacity>
        </View>
      )}

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Proje Panosu</Text>
        <View style={{flexDirection: 'row', gap: 10}}>
          <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#4D96FF' }]} onPress={() => setStatsVisible(true)}>
            <Ionicons name="pie-chart" size={20} color="#FFF" />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#FF4757' }]} onPress={handleCoachMe} disabled={coachLoading}>
            {coachLoading ? <ActivityIndicator color="#FFF" size="small" /> : <Text style={{fontSize: 20}}>🔥</Text>}
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, { backgroundColor: COLORS.primary }]} onPress={openAddModal}>
            <Ionicons name="add" size={24} color="#000" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} contentContainerStyle={styles.boardContainer} snapToInterval={COLUMN_WIDTH + 20} decelerationRate="fast">
        {renderColumn("BEKLEYENLER", 'todo', '#FF6B6B')}
        {renderColumn("SÜRÜYOR", 'in-progress', '#FFD93D')}
        {renderColumn("BİTTİ", 'done', '#6BCB77')}
      </ScrollView>

      {/* --- EKLEME / DÜZENLEME MODALI (KLAVYE KORUMALI) --- */}
      <Modal animationType="slide" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        {/* DÜZELTME 2: KeyboardAvoidingView eklendi */}
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingTask ? "Görevi Düzenle" : "Yeni Görev Ekle"}
            </Text>
            
            <Text style={styles.label}>Başlık</Text>
            <TextInput style={styles.input} placeholder="Görev Adı" placeholderTextColor="#666" value={titleInput} onChangeText={setTitleInput} />
            
            <Text style={styles.label}>Kategori</Text>
            <TextInput style={styles.input} placeholder="Kategori" placeholderTextColor="#666" value={categoryInput} onChangeText={setCategoryInput} />
            
            <Text style={styles.label}>Tarih</Text>
            <TextInput style={styles.input} placeholder="Tarih" placeholderTextColor="#666" value={dateInput} onChangeText={setDateInput} />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}><Text style={styles.cancelText}>Vazgeç</Text></TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                <Text style={styles.saveText}>{editingTask ? "Kaydet" : "Oluştur"}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* --- İSTATİSTİK MODALI --- */}
      <Modal animationType="fade" transparent={true} visible={statsVisible} onRequestClose={() => setStatsVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.statsContent}>
            <View style={{flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:20}}>
               <Text style={styles.modalTitle}>Durum Analizi</Text>
               <TouchableOpacity onPress={() => setStatsVisible(false)}>
                 <Ionicons name="close" size={24} color="#FFF" />
               </TouchableOpacity>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Tamamlanma Oranı</Text>
              <Text style={styles.statValue}>%{progressRate}</Text>
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: `${progressRate}%` }]} />
              </View>
            </View>
            <Text style={[styles.statLabel, {marginTop: 20, marginBottom: 10}]}>Kategori Dağılımı</Text>
            {chartData.length > 0 ? (
              <PieChart
                data={chartData} width={width * 0.8} height={200}
                chartConfig={{ color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})` }}
                accessor={"population"} backgroundColor={"transparent"} paddingLeft={"15"} absolute
              />
            ) : (<Text style={{color:'#666', textAlign:'center', marginVertical: 20}}>Veri yok.</Text>)}
            <Text style={styles.motivationText}>
              {progressRate < 30 ? "Hızlanman lazım!" : progressRate > 80 ? "Makine gibisin!" : "İyi gidiyorsun."}
            </Text>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 20, paddingTop: 10 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: COLORS.text },
  actionButton: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  boardContainer: { paddingHorizontal: 10, paddingBottom: 20 },
  column: { width: COLUMN_WIDTH, backgroundColor: '#151920', marginHorizontal: 10, borderRadius: 16, padding: 10, height: '85%' },
  columnHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 15, paddingLeft: 10, borderLeftWidth: 4, marginTop: 5 },
  columnTitle: { color: '#DDD', fontWeight: 'bold', fontSize: 16 },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  badgeText: { color: '#000', fontWeight: 'bold', fontSize: 12 },
  columnScroll: { flex: 1 },
  card: { backgroundColor: COLORS.card, borderRadius: 12, padding: 15, marginBottom: 15, borderLeftWidth: 3, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5, elevation: 5 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8, alignItems: 'center' },
  tag: { fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase', marginRight: 8 },
  dateTag: { fontSize: 10, color: '#888', fontStyle: 'italic' },
  cardTitle: { color: COLORS.text, fontSize: 16, fontWeight: '500', lineHeight: 22 },
  dragHint: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 10, opacity: 0.3 },
  hintText: { color: '#888', fontSize: 10, marginHorizontal: 5 },
  
  // DÜZELTME 1: İkon Butonu Stili
  iconBtn: { padding: 8, backgroundColor: '#1F2530', borderRadius: 8 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#1F2530', borderRadius: 20, padding: 20 },
  statsContent: { backgroundColor: '#1F2530', borderRadius: 20, padding: 20, maxHeight: '80%' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#FFF', marginBottom: 20, textAlign: 'center' },
  label: { color: '#888', marginBottom: 5, fontSize: 12, marginLeft: 5 },
  input: { backgroundColor: '#151920', color: '#FFF', padding: 15, borderRadius: 12, marginBottom: 15, borderWidth: 1, borderColor: '#333' },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  cancelBtn: { flex: 1, padding: 15, alignItems: 'center', marginRight: 10, backgroundColor: '#333', borderRadius: 12 },
  saveBtn: { flex: 1, padding: 15, alignItems: 'center', marginLeft: 10, backgroundColor: COLORS.accent, borderRadius: 12 },
  cancelText: { color: '#FFF', fontWeight: 'bold' },
  saveText: { color: '#000', fontWeight: 'bold' },
  adviceContainer: { backgroundColor: '#2C3A47', marginHorizontal: 20, marginBottom: 10, padding: 15, borderRadius: 12, borderLeftWidth: 5, borderLeftColor: '#FF4757', position: 'relative' },
  adviceHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
  adviceTitle: { color: '#FF4757', fontWeight: 'bold', marginLeft: 5, letterSpacing: 1 },
  adviceText: { color: '#EEE', fontSize: 14, lineHeight: 20, fontStyle: 'italic' },
  closeAdvice: { position: 'absolute', top: 10, right: 10 },
  statBox: { backgroundColor: '#151920', padding: 15, borderRadius: 12 },
  statLabel: { color: '#888', fontSize: 14, marginBottom: 5 },
  statValue: { color: '#FFF', fontSize: 24, fontWeight: 'bold', marginBottom: 10 },
  progressBarBg: { height: 10, backgroundColor: '#333', borderRadius: 5, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: COLORS.accent },
  motivationText: { textAlign: 'center', color: '#888', marginTop: 20, fontStyle: 'italic' }
});