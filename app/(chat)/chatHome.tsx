import { useEffect, useState, useRef } from "react";
import { View, Text, FlatList, Modal, Pressable, TextInput, Animated } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { API_BASE_URL } from "../constants";
import { useRouter } from "expo-router";
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function ChatHome() {
  const [loggedInUser, setLoggedInUser] = useState<{ username: string; role: string } | null>(null);
  const [teachers, setTeachers] = useState<{ username: string; role?: string }[]>([]);
  const [students, setStudents] = useState<{ username: string; role?: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showUsers, setShowUsers] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter(); // Use router for navigation

  const scaleAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const modalAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const fetchLoggedInUser = async () => {
      try {
        const user = await AsyncStorage.getItem("loggedInUser");
        if (user) {
          setLoggedInUser(JSON.parse(user));
        }
      } catch (error) {
        console.error("Error fetching logged-in user:", error);
      }
    };

    const fetchUsers = async () => {
      try {
        const [teachersResponse, studentsResponse] = await Promise.all([
          axios.get(`${API_BASE_URL}/users/teachers`),
          axios.get(`${API_BASE_URL}/users/students`),
        ]);
        setTeachers(teachersResponse.data);
        setStudents(studentsResponse.data);
      } catch (error) {
        setError("Failed to fetch users");
        console.error("Error fetching users:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLoggedInUser();
    fetchUsers();
  }, []);

  const navigateToChat = (username: string) => {
    router.push(`/(chat)/chatScreen?username=${username}`); // Updated path
  };

  const toggleUsers = () => {
    setShowUsers(!showUsers);
    // Button animation
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: showUsers ? 1 : 0.8,
        useNativeDriver: true,
      }),
      Animated.timing(rotateAnim, {
        toValue: showUsers ? 0 : 1,
        duration: 200,
        useNativeDriver: true,
      })
    ]).start();

    // Modal animation
    Animated.timing(modalAnim, {
      toValue: showUsers ? 0 : 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '45deg']
  });

  const renderUserItem = ({ item }: { item: { username: string; role?: string } }) => (
    <Pressable
      onPress={() => navigateToChat(item.username)}
      style={{
        padding: 16,
        backgroundColor: "white",
        flexDirection: "row",
        alignItems: "center",
        borderRadius: 12,
        marginVertical: 6,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 3,
      }}
    >
      <View style={{
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#e1e8ff',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12
      }}>
        <Text style={{ fontSize: 18, color: '#3498db' }}>
          {item.username.charAt(0).toUpperCase()}
        </Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 16, color: "#2c3e50", fontWeight: '600' }}>{item.username}</Text>
        <Text style={{ fontSize: 13, color: "#7f8c8d", textTransform: "capitalize" }}>{item.role}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#95a5a6" />
    </Pressable>
  );

  const filteredTeachers = teachers.filter(teacher =>
    teacher.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredStudents = students.filter(student =>
    student.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>Loading...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text style={{ color: "red" }}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#f8fafc" }}>
      <View style={{ padding: 20 }}>
        {loggedInUser && (
          <View style={{ marginBottom: 24, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#e1e8ff' }}>
            <Text style={{ fontSize: 14, color: '#666', marginBottom: 4 }}>Welcome back,</Text>
            <Text style={{ fontSize: 24, fontWeight: "bold", color: "#2c3e50" }}>
              {loggedInUser.username}
            </Text>
          </View>
        )}
      </View>

      <Modal
        visible={showUsers}
        transparent={true}
        animationType="none"
        onRequestClose={toggleUsers}
      >
        <Animated.View 
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.5)',
            opacity: modalAnim,
          }}
        >
          <Animated.View
            style={{
              transform: [
                {
                  translateY: modalAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [600, 0]
                  })
                }
              ],
              backgroundColor: '#f8fafc',
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              padding: 20,
              paddingTop: 30,
              marginTop: 'auto',
              maxHeight: '80%',
            }}
          >
            {/* Close Button */}
            <Pressable
              onPress={toggleUsers}
              style={{
                position: 'absolute',
                right: 20,
                top: 20,
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: '#e2e8f0',
                justifyContent: 'center',
                alignItems: 'center',
                zIndex: 1,
              }}
            >
              <Ionicons name="close" size={20} color="#64748b" />
            </Pressable>

            <View style={{
              width: 40,
              height: 4,
              backgroundColor: '#cbd5e1',
              borderRadius: 2,
              alignSelf: 'center',
              marginBottom: 20,
            }} />
            
            {/* Search Bar and Lists */}
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: 'white',
              padding: 12,
              borderRadius: 12,
              marginBottom: 20,
              borderWidth: 1,
              borderColor: '#e1e8ff'
            }}>
              <Ionicons name="search" size={20} color="#95a5a6" style={{ marginRight: 8 }} />
              <TextInput
                placeholder="Search users..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                style={{
                  flex: 1,
                  fontSize: 16,
                  color: '#2c3e50'
                }}
                placeholderTextColor="#95a5a6"
              />
            </View>

            <View style={{ marginBottom: 24 }}>
              <Text style={{ 
                fontSize: 18, 
                fontWeight: "600", 
                marginBottom: 12, 
                color: "#2c3e50",
                paddingLeft: 4
              }}>
                Teachers ({filteredTeachers.length})
              </Text>
              <FlatList 
                data={filteredTeachers} 
                keyExtractor={(item) => item.username} 
                renderItem={renderUserItem}
                style={{ maxHeight: 220 }}
                showsVerticalScrollIndicator={false}
              />
            </View>

            <View>
              <Text style={{ 
                fontSize: 18, 
                fontWeight: "600", 
                marginBottom: 12, 
                color: "#2c3e50",
                paddingLeft: 4
              }}>
                Students ({filteredStudents.length})
              </Text>
              <FlatList 
                data={filteredStudents} 
                keyExtractor={(item) => item.username} 
                renderItem={renderUserItem}
                style={{ maxHeight: 220 }}
                showsVerticalScrollIndicator={false}
              />
            </View>
          </Animated.View>
        </Animated.View>
      </Modal>

      {/* Floating Action Button */}
      <Animated.View
        style={{
          position: 'absolute',
          bottom: 30,
          right: 30,
          transform: [
            { scale: scaleAnim },
          ],
        }}
      >
        <LinearGradient
          colors={['#3498db', '#2980b9']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{
            borderRadius: 30,
            elevation: 5,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 5,
          }}
        >
          <Pressable
            onPress={toggleUsers}
            style={{
              width: 60,
              height: 60,
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Animated.View style={{ transform: [{ rotate: spin }] }}>
              <Ionicons 
                name={showUsers ? "close" : "people-outline"} 
                size={28} 
                color="white" 
              />
            </Animated.View>
          </Pressable>
        </LinearGradient>
      </Animated.View>
    </View>
  );
}
