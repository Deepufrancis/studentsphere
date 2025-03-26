import { useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  View,
  TextInput,
  Button,
  FlatList,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { API_BASE_URL } from "../constants";

interface Todo {
  _id: string;
  title: string;
  description?: string;
  completed: boolean;
  dueDate: Date;
  userId: string;
}

export default function TodoScreen() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTodoTitle, setNewTodoTitle] = useState("");
  const [newTodoDescription, setNewTodoDescription] = useState("");
  const [userId, setUserId] = useState<string>("");

  useEffect(() => {
    const initialize = async () => {
      const loggedInUser = await AsyncStorage.getItem('user');
      if (loggedInUser) {
        const user = JSON.parse(loggedInUser);
        setUserId(user._id);
        fetchTodos(user._id);
      }
    };
    initialize();
  }, []);

  const fetchTodos = async (id: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/todos/${id}`);
      if (!response.ok) throw new Error('Failed to fetch todos');
      const data = await response.json();
      setTodos(data);
    } catch (error) {
      Alert.alert("Error", "Failed to fetch todos");
    }
  };

  const addTodo = async () => {
    if (newTodoTitle.trim().length === 0) {
      Alert.alert("Error", "Title is required");
      return;
    }
    if (!userId) {
      Alert.alert("Error", "User not authenticated");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/todos`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: newTodoTitle.trim(),
          description: newTodoDescription.trim(),
          dueDate: new Date(),
          userId: userId,
        }),
      });
      
      if (!response.ok) throw new Error('Failed to add todo');
      const newTodo = await response.json();
      setTodos([...todos, newTodo]);
      setNewTodoTitle("");
      setNewTodoDescription("");
    } catch (error) {
      Alert.alert("Error", "Failed to add todo");
    }
  };

  const toggleTodo = async (id: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/todos/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        }
      });
      if (!response.ok) throw new Error('Failed to update todo');
      const updatedTodo = await response.json();
      setTodos(todos.map((todo) => 
        todo._id === id ? updatedTodo : todo
      ));
    } catch (error) {
      Alert.alert("Error", "Failed to update todo");
    }
  };

  const deleteTodo = async (id: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/todos/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error('Failed to delete todo');
      setTodos(todos.filter((todo) => todo._id !== id));
    } catch (error) {
      Alert.alert("Error", "Failed to delete todo");
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={newTodoTitle}
          onChangeText={setNewTodoTitle}
          placeholder="Add todo title"
        />
        <TextInput
          style={styles.input}
          value={newTodoDescription}
          onChangeText={setNewTodoDescription}
          placeholder="Add description (optional)"
        />
        <Button title="Add" onPress={addTodo} />
      </View>

      <FlatList
        data={todos}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <View style={styles.todoItem}>
            <TouchableOpacity
              style={styles.todoText}
              onPress={() => toggleTodo(item._id)}
            >
              <Text
                style={[
                  styles.todoTextContent,
                  item.completed && styles.completed,
                ]}
              >
                {item.title}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => deleteTodo(item._id)}>
              <Text style={styles.deleteButton}>✕</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  inputContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  input: {
    flex: 1,
    marginRight: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 10,
    borderRadius: 5,
  },
  todoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  todoText: {
    flex: 1,
  },
  todoTextContent: {
    fontSize: 16,
  },
  completed: {
    textDecorationLine: 'line-through',
    color: '#888',
  },
  deleteButton: {
    color: 'red',
    fontSize: 18,
    marginLeft: 10,
  },
});
