import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

export const TaskProvider = ({ children }: { children: ReactNode }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [userName, setUserNameState] = useState<string>('Kullanıcı');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const savedTasks = await AsyncStorage.getItem('virai_tasks');
        const savedName = await AsyncStorage.getItem('virai_username');
        
        if (savedTasks) {
          const parsed = JSON.parse(savedTasks);
          // ID çakışması önleme (Eski veriler için)
          const uniqueTasks = parsed.map((t: Task) => ({
             ...t, 
             id: t.id || Date.now().toString() + Math.random().toString().substr(2, 5) 
          }));
          setTasks(uniqueTasks);
        }
        if (savedName) setUserNameState(savedName);
      } catch (error) {
        console.error("Yükleme hatası:", error);
      } finally {
        setIsLoaded(true);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    if (isLoaded) {
      AsyncStorage.setItem('virai_tasks', JSON.stringify(tasks));
    }
  }, [tasks, isLoaded]);

  const setUserName = async (name: string) => {
    setUserNameState(name);
    await AsyncStorage.setItem('virai_username', name);
  };

  const clearAllData = async () => {
    try {
      await AsyncStorage.multiRemove(['virai_tasks', 'virai_username']);
      setTasks([]);
      setUserNameState('Kullanıcı');
    } catch (e) { console.error(e); }
  };

  const addTask = (title: string, category: string, date: string = '') => {
    const uniqueId = Date.now().toString() + '-' + Math.random().toString(36).substr(2, 9);
    const newTask: Task = {
      id: uniqueId, title, category, date, status: 'todo', completed: false,
    };
    setTasks(prev => [newTask, ...prev]);
  };

  // YENİ: Düzenleme Mantığı
  const editTask = (id: string, title: string, category: string, date: string = '') => {
    setTasks(prev => prev.map(task => 
      task.id === id ? { ...task, title, category, date } : task
    ));
  };

  const updateTaskStatus = (id: string, status: Task['status']) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status } : t));
  };

  const toggleTaskCompletion = (id: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id === id) {
        const newCompleted = !t.completed;
        return { ...t, completed: newCompleted, status: newCompleted ? 'done' : 'todo' };
      }
      return t;
    }));
  };

  const deleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
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