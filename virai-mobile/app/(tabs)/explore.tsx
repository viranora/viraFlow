import React, { useRef, useState, useMemo } from 'react';
import { 
  StyleSheet, Text, View, ScrollView, Dimensions, 
  PanResponder, Animated, TouchableOpacity, Modal, TextInput, Alert, 
  KeyboardAvoidingView, Platform 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../../constants/theme'; 
import { useTasks, Task } from '../../context/TaskContext'; 
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PieChart } from 'react-native-chart-kit';

const { width } = Dimensions.get('window');
const COLUMN_WIDTH = width * 0.85; 

interface DraggableCardProps {
  task: Task;
  onMove: (direction: 'next' | 'prev') => void;
  onDelete: (id: string) => void;
  onEdit: (task: Task) => void;
}

const DraggableCard = ({ task, onMove, onDelete, onEdit }: DraggableCardProps) => {
  const pan = useRef(new Animated.ValueXY()).current;
  const [isDragging, setIsDragging] = useState(false);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        setIsDragging(true);
        pan.setOffset({ x: (pan.x as any)._value, y: 0 }); 
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: (e, gestureState) => {
        let dx = gestureState.dx;
        if (task.status === 'todo' && dx < 0) dx = 0; 
        if (task.status === 'done' && dx > 0) dx = 0;
        pan.setValue({ x: dx, y: 0 });
      },
      onPanResponderRelease: (e, gestureState) => {
        setIsDragging(false);
        pan.flattenOffset();

        if (gestureState.dx > 100 && task.status !== 'done') {
          Animated.timing(pan, { toValue: { x: 500, y: 0 }, duration: 200, useNativeDriver: false }).start(() => onMove('next'));
        } 
        else if (gestureState.dx < -100 && task.status !== 'todo') {
          Animated.timing(pan, { toValue: { x: -500, y: 0 }, duration: 200, useNativeDriver: false }).start(() => onMove('prev'));
        } 
        else {
          Animated.spring(pan, { toValue: { x: 0, y: 0 }, friction: 5, useNativeDriver: false }).start();
        }
      }
    })
  ).current;

  const getGradientColors = () => {
    switch(task.status) {
      case 'todo': return ['#3D3833', '#2D2926'] as const;
      case 'in-progress': return ['#433D35', '#2D2926'] as const;
      case 'done': return ['#2D2926', '#1E1B18'] as const;
      default: return [COLORS.card, COLORS.background] as const;
    }
  };

  const statusColor = task.status === 'todo' ? COLORS.error : task.status === 'in-progress' ? COLORS.primary : COLORS.success;

  const rotate = pan.x.interpolate({
    inputRange: [-200, 0, 200],
    outputRange: ['-5deg', '0deg', '5deg']
  });

  return (
    <Animated.View
      style={{ 
        transform: [{ translateX: pan.x }, { rotate }], 
        zIndex: isDragging ? 999 : 1,
        marginBottom: 15
      }}
      {...panResponder.panHandlers}
    >
      <LinearGradient
        colors={[...getGradientColors()]} 
        style={[styles.card, { borderLeftColor: statusColor }]}
        start={{x: 0, y: 0}} end={{x: 1, y: 1}}
      >
        <View style={styles.cardHeader}>
          <View style={styles.tagContainer}>
             <Text style={[styles.tag, { color: statusColor }]}>{task.category?.toUpperCase() || 'GENERAL'}</Text>
          </View>
          
          <View style={styles.iconGroup}>
            <TouchableOpacity onPress={() => onEdit(task)} style={styles.iconBtn}>
              <Ionicons name="create-outline" size={18} color={COLORS.accent} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => onDelete(task.id)} style={styles.iconBtn}>
              <Ionicons name="trash-outline" size={18} color={COLORS.error} />
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.cardTitle}>{task.title}</Text>
        
        <View style={styles.cardFooter}>
           <Text style={styles.dateText}>📅 {task.date || 'No Date'}</Text>
        </View>

      </LinearGradient>
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

  const chartData = useMemo(() => {
    const categoryCounts: Record<string, number> = {};
    tasks.forEach(task => {
      const cat = task.category || 'Other';
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    });
    const colors = [COLORS.error, COLORS.primary, COLORS.success, '#4D96FF', COLORS.accent];
    return Object.keys(categoryCounts).map((key, index) => ({
      name: key, population: categoryCounts[key], color: colors[index % colors.length], legendFontColor: COLORS.accent, legendFontSize: 12
    }));
  }, [tasks]);

  const progressRate = tasks.length > 0 ? Math.round((tasks.filter(t => t.status === 'done').length / tasks.length) * 100) : 0;

  const handleMoveTask = (task: Task, direction: 'next' | 'prev') => {
    const statusOrder: Task['status'][] = ['todo', 'in-progress', 'done'];
    const currentIndex = statusOrder.indexOf(task.status);
    let nextIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;

    if (nextIndex >= 0 && nextIndex < statusOrder.length) {
      updateTaskStatus(task.id, statusOrder[nextIndex]);
    }
  };

  const handleSave = () => {
    if(!titleInput.trim()) return;
    if (editingTask) editTask(editingTask.id, titleInput, categoryInput || 'General', dateInput);
    else addTask(titleInput, categoryInput || 'General', dateInput);
    setModalVisible(false);
  };

  const renderColumn = (title: string, status: Task['status'], accentColor: string) => {
    const columnTasks = tasks.filter(t => t.status === status);
    return (
      <View style={styles.columnContainer}>
        <LinearGradient colors={[COLORS.card, COLORS.background]} style={styles.columnGradient}>
          <View style={[styles.columnHeader, { borderBottomColor: accentColor }]}>
            <Text style={[styles.columnTitle, { color: accentColor }]}>{title}</Text>
            <View style={[styles.countBadge, { backgroundColor: accentColor + '30' }]}>
              <Text style={{color: accentColor, fontWeight:'bold'}}>{columnTasks.length}</Text>
            </View>
          </View>
          
          <ScrollView style={styles.columnScroll} showsVerticalScrollIndicator={false} contentContainerStyle={{paddingBottom: 20}}>
            {columnTasks.length === 0 ? (
               <View style={styles.emptyState}>
                 <Ionicons name="clipboard-outline" size={30} color={COLORS.card} />
                 <Text style={{color:COLORS.accent, fontSize:12, marginTop:5}}>Empty</Text>
               </View>
            ) : (
              columnTasks.map(task => (
                <DraggableCard 
                  key={task.id} task={task} 
                  onMove={(dir) => handleMoveTask(task, dir)} 
                  onDelete={(id) => Alert.alert("Delete", "Are you sure?", [{text:"Cancel"}, {text:"Delete", style:'destructive', onPress:()=>deleteTask(id)}])}
                  onEdit={(t) => { setEditingTask(t); setTitleInput(t.title); setCategoryInput(t.category); setDateInput(t.date || ''); setModalVisible(true); }}
                />
              ))
            )}
          </ScrollView>
        </LinearGradient>
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      
      <View style={styles.header}>
        <View>
          <Text style={styles.subHeader}>VIRA FLOW</Text>
          <Text style={styles.headerTitle}>Dashboard</Text>
        </View>
        <View style={styles.headerButtons}>
          <TouchableOpacity style={[styles.iconButton, {backgroundColor: COLORS.card}]} onPress={() => setStatsVisible(true)}>
            <Ionicons name="stats-chart" size={20} color={COLORS.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.iconButton, {backgroundColor: COLORS.primary}]} onPress={() => { setEditingTask(null); setTitleInput(''); setCategoryInput(''); setDateInput(''); setModalVisible(true); }}>
            <Ionicons name="add" size={24} color="#000" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        horizontal 
        pagingEnabled 
        snapToInterval={COLUMN_WIDTH + 20} 
        decelerationRate="fast" 
        contentContainerStyle={styles.boardContent}
        showsHorizontalScrollIndicator={false}
      >
        {renderColumn("TO DO", 'todo', COLORS.error)}
        {renderColumn("IN PROGRESS", 'in-progress', COLORS.primary)}
        {renderColumn("DONE", 'done', COLORS.success)}
      </ScrollView>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalHeader}>{editingTask ? "Edit Task" : "New Task"}</Text>
            
            <TextInput style={styles.input} placeholder="Task Title" placeholderTextColor={COLORS.accent} value={titleInput} onChangeText={setTitleInput} />
            <View style={{flexDirection:'row', gap:10}}>
               <TextInput style={[styles.input, {flex:1}]} placeholder="Category" placeholderTextColor={COLORS.accent} value={categoryInput} onChangeText={setCategoryInput} />
               <TextInput style={[styles.input, {flex:1}]} placeholder="Date" placeholderTextColor={COLORS.accent} value={dateInput} onChangeText={setDateInput} />
            </View>

            <View style={styles.modalBtnGroup}>
              <TouchableOpacity style={styles.cancelBtn} onPress={()=>setModalVisible(false)}><Text style={{color:'#FFF'}}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSave}><Text style={{color:'#000', fontWeight:'bold'}}>Save</Text></TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal visible={statsVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.statsContainer}>
            <Text style={styles.statsTitle}>Performance Analysis</Text>
            {chartData.length > 0 ? (
                <PieChart
                data={chartData} width={width * 0.8} height={200}
                chartConfig={{ color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})` }}
                accessor={"population"} backgroundColor={"transparent"} paddingLeft={"15"} absolute
                />
            ) : <Text style={{color:COLORS.accent, marginBottom:20}}>No data</Text>}
            <Text style={styles.progressText}>Completion: {progressRate}%</Text>
            <TouchableOpacity style={styles.closeStatsBtn} onPress={()=>setStatsVisible(false)}>
              <Text style={{color:'#FFF'}}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  subHeader: { color: COLORS.primary, fontSize: 10, letterSpacing: 2, fontWeight: 'bold' },
  headerTitle: { color: COLORS.text, fontSize: 26, fontWeight: 'bold' },
  headerButtons: { flexDirection: 'row', gap: 10 },
  iconButton: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  boardContent: { paddingHorizontal: 10, paddingBottom: 20 },
  columnContainer: { width: COLUMN_WIDTH, marginHorizontal: 10, height: '82%', borderRadius: 20, overflow: 'hidden' },
  columnGradient: { flex: 1, padding: 15 },
  columnHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, borderBottomWidth: 1, paddingBottom: 10 },
  columnTitle: { fontSize: 16, fontWeight: 'bold', letterSpacing: 1 },
  countBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  columnScroll: { flex: 1 },
  emptyState: { alignItems: 'center', marginTop: 50, opacity: 0.5 },
  card: { borderRadius: 12, padding: 16, borderLeftWidth: 4, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  tagContainer: { backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
  tag: { fontSize: 10, fontWeight: 'bold' },
  iconGroup: { flexDirection: 'row', gap: 8 },
  iconBtn: { padding: 4 },
  cardTitle: { color: COLORS.text, fontSize: 15, fontWeight: '500', lineHeight: 22, marginBottom: 10 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)', paddingTop: 10 },
  dateText: { color: COLORS.accent, fontSize: 11 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', padding: 20 },
  modalContainer: { backgroundColor: COLORS.card, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: '#433D35' },
  modalHeader: { color: COLORS.text, fontSize: 20, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  input: { backgroundColor: COLORS.background, color: COLORS.text, padding: 15, borderRadius: 10, marginBottom: 15, borderWidth: 1, borderColor: '#433D35' },
  modalBtnGroup: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  cancelBtn: { flex: 1, padding: 15, backgroundColor: '#3D3833', borderRadius: 10, marginRight: 10, alignItems: 'center' },
  saveBtn: { flex: 1, padding: 15, backgroundColor: COLORS.primary, borderRadius: 10, marginLeft: 10, alignItems: 'center' },
  statsContainer: { backgroundColor: COLORS.card, padding: 20, borderRadius: 20, alignItems: 'center' },
  statsTitle: { color: COLORS.text, fontSize: 18, fontWeight: 'bold', marginBottom: 20 },
  progressText: { color: COLORS.primary, fontSize: 20, fontWeight: 'bold', marginVertical: 20 },
  closeStatsBtn: { padding: 10 },
});