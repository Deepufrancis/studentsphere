import { useEffect, useState, useRef } from "react";
import { View, Text, FlatList, Modal, Pressable, TextInput, Animated, Image } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { API_BASE_URL } from "../constants";
import { useRouter } from "expo-router";
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { format } from 'date-fns';

export default function ChatHome() {
  const [username, setUsername] = useState<string>("");
  const [profilePicture, setProfilePicture] = useState<string>("");
  const [teachers, setTeachers] = useState<{ username: string; role?: string; profilePic?: string }[]>([]);
  const [students, setStudents] = useState<{ username: string; role?: string; profilePic?: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showUsers, setShowUsers] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<'all' | 'teachers' | 'students'>('all');
  const [recentChats, setRecentChats] = useState<Array<{
    participant: string;
    lastMessage: {
      sender: string;
      message: string;
      timestamp: string;
    } | null;
  }>>([]);
  const [existingChats, setExistingChats] = useState<Set<string>>(new Set());
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter(); // Use router for navigation

  const scaleAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const modalAnim = useRef(new Animated.Value(0)).current;

  const [fabMeasurements, setFabMeasurements] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const storedUsername = await AsyncStorage.getItem("loggedInUser");
        if (storedUsername) {
          setUsername(storedUsername);

          // Fetch all data in parallel
          const [profileResponse, teachersResponse, studentsResponse, chatsResponse] = await Promise.all([
            axios.get(`${API_BASE_URL}/users/profile?username=${storedUsername}`),
            axios.get(`${API_BASE_URL}/users/teachers`),
            axios.get(`${API_BASE_URL}/users/students`),
            axios.get(`${API_BASE_URL}/chat/all/${storedUsername}`)
          ]);

          setProfilePicture(profileResponse.data.profilePicture);
          
          // Create set of users with existing chats
          const chatUsers = new Set(chatsResponse.data.map((chat: any) => chat.participant));
          setExistingChats(chatUsers);

          // Sort users - put users with existing chats first
          const sortUsers = (users: any[]) => 
            users.sort((a, b) => {
              const aHasChat = chatUsers.has(a.username) ? 1 : 0;
              const bHasChat = chatUsers.has(b.username) ? 1 : 0;
              return bHasChat - aHasChat;
            });

          setTeachers(sortUsers(teachersResponse.data));
          setStudents(sortUsers(studentsResponse.data));
          setRecentChats(chatsResponse.data);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        setError("Failed to fetch data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    fetchRecentChats();
  }, []);

  const fetchRecentChats = async () => {
    try {
      const storedUsername = await AsyncStorage.getItem("loggedInUser");
      if (storedUsername) {
        const response = await axios.get(`${API_BASE_URL}/chat/recent/${storedUsername}`);
        setRecentChats(response.data);
      }
    } catch (error) {
      console.error("Error fetching chats:", error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchRecentChats();
    setRefreshing(false);
  };

  const navigateToChat = (username: string) => {
    router.push(`/(chat)/chatScreen?username=${username}`); // Updated path
  };

  const toggleUsers = () => {
    if (showUsers) {
      // Closing sequence
      Animated.parallel([
        Animated.timing(modalAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        })
      ]).start(() => {
        setShowUsers(false);
      });
    } else {
      // Opening sequence
      setShowUsers(true);
      Animated.parallel([
        Animated.timing(modalAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 0.8,
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        })
      ]).start();
    }
  };

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '45deg']
  });

  const renderUserItem = ({ item }: { item: { username: string; role?: string; profilePic?: string } }) => (
    <Pressable
      onPress={() => navigateToChat(item.username)}
      style={[
        {
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
        },
        existingChats.has(item.username) && {
          borderWidth: 1,
          borderColor: '#3498db',
        }
      ]}
    >
      {item.profilePic ? (
        <Image
          source={{ uri: item.profilePic }}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            marginRight: 12,
          }}
        />
      ) : (
        <View style={{
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: '#e1e8ff',
          justifyContent: 'center',
          alignItems: 'center',
          marginRight: 12,
        }}>
          <Text style={{ fontSize: 18, color: '#3498db' }}>
            {item.username.charAt(0).toUpperCase()}
          </Text>
        </View>
      )}
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 16, color: "#2c3e50", fontWeight: '600' }}>{item.username}</Text>
        <View style={{ 
          backgroundColor: item.role === 'teacher' ? '#fff5f5' : '#f0f4ff',
          paddingHorizontal: 8,
          paddingVertical: 4,
          borderRadius: 12,
          marginTop: 4,
          alignSelf: 'flex-start',
          borderWidth: 1,
          borderColor: item.role === 'teacher' ? '#feb2b2' : '#c3dafe'
        }}>
          <Text style={{ 
            fontSize: 12, 
            color: item.role === 'teacher' ? '#f56565' : '#3182ce',
            fontWeight: '500',
            textTransform: 'capitalize'
          }}>
            {item.role}
          </Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#95a5a6" />
      {existingChats.has(item.username) && (
        <View style={{
          position: 'absolute',
          top: 8,
          right: 8,
          backgroundColor: '#3498db',
          borderRadius: 4,
          paddingHorizontal: 6,
          paddingVertical: 2,
        }}>
          <Text style={{ color: 'white', fontSize: 10 }}>Active Chat</Text>
        </View>
      )}
    </Pressable>
  );

  const renderRecentChat = ({ item }: { item: any }) => (
    <Pressable
      onPress={() => navigateToChat(item.participant)}
      style={{
        padding: 16,
        backgroundColor: "white",
        borderRadius: 12,
        marginBottom: 8,
        marginHorizontal: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
      }}
    >
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <Text style={{ fontSize: 16, fontWeight: "600", color: "#2c3e50" }}>
          {item.participant}
        </Text>
        {item.lastMessage && (
          <Text style={{ fontSize: 12, color: "#95a5a6" }}>
            {format(new Date(item.lastMessage.timestamp), 'MMM d, h:mm a')}
          </Text>
        )}
      </View>
      {item.lastMessage && (
        <Text style={{ marginTop: 4, color: "#7f8c8d" }} numberOfLines={1}>
          {item.lastMessage.sender === username ? "You: " : ""}{item.lastMessage.message}
        </Text>
      )}
    </Pressable>
  );

  const filteredTeachers = teachers.filter(
    (teacher) =>
      teacher.username.toLowerCase().includes(searchQuery.toLowerCase()) &&
      teacher.username !== username // Exclude logged-in user
  );

  const filteredStudents = students.filter(
    (student) =>
      student.username.toLowerCase().includes(searchQuery.toLowerCase()) &&
      student.username !== username // Exclude logged-in user
  );

  const getFilteredUsers = () => {
    const filtered = [...filteredTeachers, ...filteredStudents];
    switch (activeFilter) {
      case 'teachers':
        return filteredTeachers;
      case 'students':
        return filteredStudents;
      default:
        return filtered;
    }
  };

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
        {username && (
          <View style={{ marginBottom: 24, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#e1e8ff' }}>
            <Text style={{ fontSize: 14, color: '#666', marginBottom: 4 }}>Welcome back,</Text>
            <Text style={{ fontSize: 24, fontWeight: "bold", color: "#2c3e50" }}>
              {username}
            </Text>
          </View>
        )}
      </View>

      <View style={{ flex: 1, paddingHorizontal: 20 }}>
        <Text style={{ fontSize: 18, fontWeight: "600", marginBottom: 16, color: "#2c3e50" }}>
          Recent Chats
        </Text>
        <FlatList
          data={recentChats}
          renderItem={renderRecentChat}
          keyExtractor={(item) => item.chatId}
          refreshing={refreshing}
          onRefresh={onRefresh}
          contentContainerStyle={{ flexGrow: 1 }}
          ListEmptyComponent={
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <Text style={{ textAlign: "center", color: "#95a5a6", marginTop: 20 }}>
                No recent chats
              </Text>
            </View>
          }
        />
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
              position: 'absolute',
              right: 30,
              bottom: 30,
              borderRadius: 20,
              backgroundColor: '#f8fafc',
              transform: [
                {
                  scale: modalAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 1]
                  })
                }
              ],
              width: '90%',
              maxHeight: '80%',
              padding: 20,
              paddingTop: 30,
              transformOrigin: 'bottom right',
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
              borderRadius: 25,
              marginBottom: 20,
              shadowColor: "#000",
              shadowOffset: {
                width: 0,
                height: 2,
              },
              shadowOpacity: 0.1,
              shadowRadius: 8,
              elevation: 4,
              borderWidth: 1,
              borderColor: '#e1e8ff',
              marginHorizontal: 4,
            }}>
              <View style={{
                backgroundColor: '#f0f4ff',
                padding: 8,
                borderRadius: 20,
                marginRight: 12
              }}>
                <Ionicons name="search" size={20} color="#3498db" />
              </View>
              <TextInput
                placeholder="Search users..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                style={{
                  flex: 1,
                  fontSize: 16,
                  color: '#2c3e50',
                  paddingVertical: 4,
                }}
                placeholderTextColor="#95a5a6"
              />
            </View>

            {/* Filter Buttons */}
            <View style={{
              flexDirection: 'row',
              marginTop: 12,
              marginBottom: 16,
              gap: 8
            }}>
              {(['all', 'teachers', 'students'] as const).map((filter) => (
                <Pressable
                  key={filter}
                  onPress={() => setActiveFilter(filter)}
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    borderRadius: 20,
                    backgroundColor: activeFilter === filter ? '#3498db' : '#e2e8f0',
                  }}
                >
                  <Text style={{
                    color: activeFilter === filter ? 'white' : '#64748b',
                    fontSize: 14,
                    fontWeight: '500',
                    textTransform: 'capitalize'
                  }}>
                    {filter}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Combined List */}
            <FlatList
              data={getFilteredUsers()}
              keyExtractor={(item) => item.username}
              renderItem={renderUserItem}
              style={{ maxHeight: 400 }}
              showsVerticalScrollIndicator={false}
            />
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
          zIndex: showUsers ? 0 : 1,
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
