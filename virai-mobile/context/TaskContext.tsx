import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import * as Haptics from 'expo-haptics'; // Eklendi

export interface Task {
  id: string;
  title: string;
  category: string;
  status: 'todo' | 'in-progress' | 'done';
  completed: boolean;
  date?: string;
}

interface TaskContextType {
  tasks: Task[];
  userName: string;
  setUserName: (name: string) => void;
  addTask: (title: string, category: string, date?: string) => void;
  editTask: (id: string, newTitle: string, newCategory: string, newDate?: string) => void;
  updateTaskStatus: (id: string, status: Task['status']) => void;
  toggleTaskCompletion: (id: string) => void;
  deleteTask: (id: string) => void;
  clearAllData: () => void;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

async function saveEncrypted(key: string, value: any) {
  try {
    const jsonValue = JSON.stringify(value);
    await SecureStore.setItemAsync(key, jsonValue);
  } catch (e) {
    console.error("Encryption save error:", e);
  }
}

async function getEncrypted(key: string) {
  try {
    const value = await SecureStore.getItemAsync(key);
    return value ? JSON.parse(value) : null;
  } catch (e) {
    console.error("Encryption read error:", e);
    return null;
  }
}

export const TaskProvider = ({ children }: { children: ReactNode }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [userName, setUserNameState] = useState<string>('User');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      const savedTasks = await getEncrypted('viraflow_secure_tasks');
      const savedName = await SecureStore.getItemAsync('viraflow_secure_username');
      
      if (savedTasks) setTasks(savedTasks);
      if (savedName) setUserNameState(savedName);
      
      setIsLoaded(true);
    };
    loadData();
  }, []);

  useEffect(() => {
    if (isLoaded) {
      saveEncrypted('viraflow_secure_tasks', tasks);
    }
  }, [tasks, isLoaded]);

  const setUserName = async (name: string) => {
    setUserNameState(name);
    await SecureStore.setItemAsync('viraflow_secure_username', name);
  };

  const clearAllData = async () => {
    try {
      await SecureStore.deleteItemAsync('viraflow_secure_tasks');
      await SecureStore.deleteItemAsync('viraflow_secure_username');
      setTasks([]);
      setUserNameState('User');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning); // Veri sıfırlama uyarısı
    } catch (e) { console.error(e); }
  };

  const addTask = (title: string, category: string, date: string = '') => {
    const uniqueId = Date.now().toString() + '-' + Math.random().toString(36).substr(2, 9);
    const newTask: Task = {
      id: uniqueId, title, category, date, status: 'todo', completed: false,
    };
    setTasks(prev => [newTask, ...prev]);
  };

  const editTask = (id: string, title: string, category: string, date: string = '') => {
    setTasks(prev => prev.map(task => 
      task.id === id ? { ...task, title, category, date } : task
    ));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); // Düzenleme tıkı
  };

  const updateTaskStatus = (id: string, status: Task['status']) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status } : t));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); // Sürükleme tıkı
  };

  const toggleTaskCompletion = (id: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id === id) {
        const newCompleted = !t.completed;
        if (newCompleted) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); // Tamamlama kutlaması
        }
        return { ...t, completed: newCompleted, status: newCompleted ? 'done' : 'todo' };
      }
      return t;
    }));
  };

  const deleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); // Silme sarsıntısı
  };

  return (
    <TaskContext.Provider value={{ tasks, userName, setUserName, addTask, editTask, updateTaskStatus, toggleTaskCompletion, deleteTask, clearAllData }}>
      {children}
    </TaskContext.Provider>
  );
};

export const useTasks = () => {
  const context = useContext(TaskContext);
  if (!context) throw new Error("useTasks error");
  return context;
};