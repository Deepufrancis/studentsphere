import { useEffect, useState, useRef } from "react";
import { View, Text, FlatList, Modal, Pressable, TextInput, Animated, Image, StyleSheet, KeyboardAvoidingView, Platform, SafeAreaView } from "react-native";
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
    chatId?: string;
    participant: string;
    profilePic?: string;
    lastMessage: {
      sender: string;
      message: string;
      timestamp: string;
    } | null;
  }>>([]);
  const [existingChats, setExistingChats] = useState<Set<string>>(new Set());
  const [refreshing, setRefreshing] = useState(false);
  const [allUsers, setAllUsers] = useState<Map<string, { role?: string; profilePic?: string }>>(new Map());
  const router = useRouter(); // Use router for navigation

  const scaleAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const modalAnim = useRef(new Animated.Value(0)).current;

  const [fabMeasurements, setFabMeasurements] = useState({ x: 0, y: 0 });

  const [activeChatUser, setActiveChatUser] = useState<string | null>(null);
  const [currentMessage, setCurrentMessage] = useState("");
  const [activeMessages, setActiveMessages] = useState<any[]>([]);
  const chatPanelAnim = useRef(new Animated.Value(1000)).current;
  const messageListRef = useRef<FlatList>(null);

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

  useEffect(() => {
    const fetchData = async () => {
      try {
        const storedUsername = await AsyncStorage.getItem("loggedInUser");
        if (storedUsername) {
          setUsername(storedUsername);
          console.log(`[ChatHome] Searching chats for logged-in user: ${storedUsername}`);

          // Fetch all data in parallel, but use /chat/search-participants for chats
          const [profileResponse, teachersResponse, studentsResponse, searchChatsResponse] = await Promise.all([
            axios.get(`${API_BASE_URL}/users/profile?username=${storedUsername}`),
            axios.get(`${API_BASE_URL}/users/teachers`),
            axios.get(`${API_BASE_URL}/users/students`),
            axios.get(`${API_BASE_URL}/chat/search-participants/${storedUsername}`)
          ]);

          setProfilePicture(profileResponse.data.profilePicture);

          // Build map of all users with their profile pics and roles
          const userMap = new Map();
          teachersResponse.data.forEach((teacher: any) => {
            userMap.set(teacher.username, {
              role: 'teacher',
              profilePic: teacher.profilePic || teacher.profilePicture
            });
          });
          studentsResponse.data.forEach((student: any) => {
            userMap.set(student.username, {
              role: 'student',
              profilePic: student.profilePic || student.profilePicture
            });
          });
          setAllUsers(userMap);

          // Use searchChatsResponse to get all chats where user is a participant
          let filteredChats = [];
          if (Array.isArray(searchChatsResponse.data)) {
            filteredChats = searchChatsResponse.data.filter(
              (chat: any) =>
                Array.isArray(chat.participants) &&
                chat.participants.includes(storedUsername)
            );
          }

          if (filteredChats.length > 0) {
            console.log("[ChatHome] chat found");
          }

          console.log(`[ChatHome] Filtered chats from search-participants for "${storedUsername}":`, filteredChats);

          // For each chat, try to find the other participant and fetch last message if needed
          // We'll need to fetch the full chat details for each chatId to get lastMessage
          const chatDetails = await Promise.all(
            filteredChats.map(async (chat: any) => {
              // Find the other participant
              const otherParticipant = chat.participants.find((p: string) => p !== storedUsername);
              // Fetch messages for this chat
              try {
                const messagesRes = await axios.get(`${API_BASE_URL}/chat/${storedUsername}/${otherParticipant}`);
                const messages = messagesRes.data;
                const lastMessage = messages && messages.length > 0 ? messages[messages.length - 1] : null;
                return {
                  chatId: chat.chatId,
                  participant: otherParticipant,
                  participants: chat.participants,
                  lastMessage,
                  profilePic: userMap.get(otherParticipant)?.profilePic || null,
                };
              } catch (err) {
                return {
                  chatId: chat.chatId,
                  participant: otherParticipant,
                  participants: chat.participants,
                  lastMessage: null,
                  profilePic: userMap.get(otherParticipant)?.profilePic || null,
                };
              }
            })
          );

          setRecentChats(chatDetails);

          // Create set of users with existing chats
          const chatUsers = new Set(chatDetails.map((chat: any) => chat.participant));
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
        }
      } catch (error) {
        console.error("[ChatHome] Error fetching data:", error);
        setError("Failed to fetch data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const fetchRecentChats = async () => {
    try {
      const storedUsername = await AsyncStorage.getItem("loggedInUser");
      if (storedUsername) {
        console.log(`[ChatHome] Refreshing chats for user: ${storedUsername}`);
        const response = await axios.get(`${API_BASE_URL}/chat/recent/${storedUsername}`);

        if (response.data && response.data.length > 0) {
          console.log(`[ChatHome] Found ${response.data.length} recent chats for "${storedUsername}"`);
          response.data.forEach((chat: any) => {
            console.log(`[ChatHome] ${storedUsername} found in chat with: ${chat.participant}, last message: "${chat.lastMessage?.message}"`);
          });
        } else {
          console.log(`[ChatHome] No recent chats found for "${storedUsername}"`);
        }

        // Add profile pics to chat data
        const enhancedChats = response.data.map((chat: any) => ({
          ...chat,
          profilePic: allUsers.get(chat.participant)?.profilePic || null,
        }));

        setRecentChats(enhancedChats);

        // Update existingChats set
        const chatUsers = new Set(response.data.map((chat: any) => chat.participant));
        setExistingChats(chatUsers);
      }
    } catch (error) {
      console.error("[ChatHome] Error fetching chats:", error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchRecentChats();
    setRefreshing(false);
  };

  const toggleChatPanel = (show: boolean) => {
    Animated.spring(chatPanelAnim, {
      toValue: show ? 0 : 1000,
      useNativeDriver: true,
    }).start();
  };

  useEffect(() => {
    const fetchMessages = async () => {
      if (!activeChatUser || !username) return;
      
      try {
        const response = await axios.get(`${API_BASE_URL}/chat/${username}/${activeChatUser}`);
        setActiveMessages(response.data);
      } catch (error) {
        console.error("Error fetching messages:", error);
      }
    };

    if (activeChatUser) {
      fetchMessages();
      toggleChatPanel(true);
    }
  }, [activeChatUser]);

  const sendMessage = async () => {
    if (!currentMessage.trim() || !activeChatUser || !username) return;

    try {
      await axios.post(`${API_BASE_URL}/chat/send`, {
        sender: username,
        receiver: activeChatUser,
        message: currentMessage.trim()
      });

      setActiveMessages(prev => [...prev, {
        sender: username,
        message: currentMessage.trim(),
        timestamp: new Date().toISOString()
      }]);
      
      setCurrentMessage("");
      fetchRecentChats();
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const closeChat = () => {
    toggleChatPanel(false);
    setTimeout(() => setActiveChatUser(null), 300);
  };

  const navigateToChat = (selectedUsername: string) => {
    setActiveChatUser(selectedUsername);
  };

  const createTestChat = async (receiverUsername: string) => {
    try {
      const loggedInUser = await AsyncStorage.getItem("loggedInUser");
      if (!loggedInUser) return;
      
      // Create a message
      const response = await axios.post(`${API_BASE_URL}/chat/send`, {
        sender: loggedInUser,
        receiver: receiverUsername,
        message: `Hello ${receiverUsername}, this is a test message from ${loggedInUser}!`
      });
      
      if (response.data.success) {
        console.log("Test message sent successfully");
        fetchRecentChats();
        navigateToChat(receiverUsername);
      }
    } catch (error) {
      console.error("Error sending test message:", error);
    }
  };

  const renderUserItem = ({ item }: { item: { username: string; role?: string; profilePic?: string } }) => (
    <Pressable
      onPress={() => navigateToChat(item.username)}
      onLongPress={() => createTestChat(item.username)}
      style={[
        styles.userItem,
        existingChats.has(item.username) && styles.activeUserItem
      ]}
    >
      {item.profilePic ? (
        <Image
          source={{ uri: item.profilePic }}
          style={styles.userAvatar}
        />
      ) : (
        <View style={styles.userAvatarPlaceholder}>
          <Text style={styles.userAvatarText}>
            {item.username.charAt(0).toUpperCase()}
          </Text>
        </View>
      )}
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.username}</Text>
        <View style={[
          styles.roleTag,
          item.role === 'teacher' ? styles.teacherRoleTag : styles.studentRoleTag
        ]}>
          <Text style={[
            styles.roleTagText,
            item.role === 'teacher' ? styles.teacherRoleText : styles.studentRoleText
          ]}>
            {item.role}
          </Text>
        </View>
        <Text style={styles.hintText}>
          Tap to chat 
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#95a5a6" />
      {existingChats.has(item.username) && (
        <View style={styles.activeChatBadge}>
          <Text style={styles.activeChatText}>Active Chat</Text>
        </View>
      )}
    </Pressable>
  );

  const renderRecentChat = ({ item }: { item: any }) => (
    <Pressable
      onPress={() => navigateToChat(item.participant)}
      style={styles.chatItem}
    >
      <View style={styles.chatItemContainer}>
        {item.profilePic ? (
          <Image
            source={{ uri: item.profilePic }}
            style={styles.chatAvatar}
          />
        ) : (
          <View style={styles.chatAvatarPlaceholder}>
            <Text style={styles.chatAvatarText}>
              {item.participant.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
        
        <View style={styles.chatContent}>
          <View style={styles.chatHeader}>
            <Text style={styles.chatName}>
              {item.participant}
            </Text>
            {item.lastMessage && (
              <Text style={styles.chatTime}>
                {format(new Date(item.lastMessage.timestamp), 'MMM d, h:mm a')}
              </Text>
            )}
          </View>
          
          {allUsers.get(item.participant)?.role && (
            <View style={[
              styles.chatRoleTag,
              allUsers.get(item.participant)?.role === 'teacher' 
                ? styles.teacherRoleTag 
                : styles.studentRoleTag
            ]}>
              <Text style={[
                styles.chatRoleText,
                allUsers.get(item.participant)?.role === 'teacher' 
                  ? styles.teacherRoleText 
                  : styles.studentRoleText
              ]}>
                {allUsers.get(item.participant)?.role}
              </Text>
            </View>
          )}
          
          {item.lastMessage && (
            <Text style={styles.chatMessage} numberOfLines={1}>
              {item.lastMessage.sender === username ? "You: " : ""}{item.lastMessage.message}
            </Text>
          )}
        </View>
      </View>
    </Pressable>
  );

  const renderMessage = ({ item }: { item: any }) => (
    <View style={[
      styles.messageContainer,
      item.sender === username ? styles.sentMessage : styles.receivedMessage
    ]}>
      <Text style={styles.messageText}>{item.message}</Text>
      <Text style={styles.messageTimestamp}>{format(new Date(item.timestamp), 'h:mm a')}</Text>
    </View>
  );

  const filteredTeachers = teachers.filter(
    (teacher) =>
      teacher.username.toLowerCase().includes(searchQuery.toLowerCase()) &&
      teacher.username !== username 
  );

  const filteredStudents = students.filter(
    (student) =>
      student.username.toLowerCase().includes(searchQuery.toLowerCase()) &&
      student.username !== username 
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
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.mainView]}>
        <View style={styles.header}>
          <View style={styles.welcomeSection}>
            <Text style={styles.welcomeText}>Messages</Text>
            {username && (
              <Text style={styles.usernameText}>
                {recentChats.length} conversations
              </Text>
            )}
          </View>
          
          {/* Search and Filter Section */}
          <View style={styles.searchContainer}>
            <View style={styles.searchIconContainer}>
              <Ionicons name="search" size={20} color="#3498db" />
            </View>
            <TextInput
              placeholder="Search users..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={styles.searchInput}
              placeholderTextColor="#95a5a6"
            />
          </View>

          <View style={styles.filterContainer}>
            {(['all', 'teachers', 'students'] as const).map((filter) => (
              <Pressable
                key={filter}
                onPress={() => setActiveFilter(filter)}
                style={[
                  styles.filterButton,
                  activeFilter === filter ? styles.activeFilterButton : null
                ]}
              >
                <Text style={[
                  styles.filterText,
                  activeFilter === filter ? styles.activeFilterText : null
                ]}>
                  {filter}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.chatListContainer}>
          {/* All Users List */}
          <FlatList
            data={getFilteredUsers()}
            renderItem={renderUserItem}
            keyExtractor={(item) => item.username}
            ListHeaderComponent={() => (
              recentChats.length > 0 ? (
                <View style={styles.recentSection}>
                  <Text style={styles.sectionTitle}>Recent Chats</Text>
                  <FlatList
                    data={recentChats}
                    renderItem={renderRecentChat}
                    keyExtractor={(item) => item.chatId || item.participant}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.recentChatsContent}
                  />
                </View>
              ) : null
            )}
            ListHeaderComponentStyle={styles.listHeader}
            contentContainerStyle={styles.userListContent}
            refreshing={refreshing}
            onRefresh={onRefresh}
          />
        </View>
      </Animated.View>

      {/* Chat Panel */}
      <Animated.View style={[
        styles.chatPanel,
        {
          transform: [{ translateX: chatPanelAnim }]
        }
      ]}>
        {activeChatUser && (
          <SafeAreaView style={{ flex: 1 }}>
            <View style={styles.chatHeader}>
              <Pressable onPress={closeChat} style={styles.backButton}>
                <Ionicons name="chevron-back" size={24} color="#3498db" />
              </Pressable>
              <Text style={styles.chatHeaderTitle}>{activeChatUser}</Text>
            </View>

            <FlatList
              ref={messageListRef}
              data={activeMessages}
              renderItem={renderMessage}
              keyExtractor={(_, index) => index.toString()}
              contentContainerStyle={styles.messagesList}
              onContentSizeChange={() => messageListRef.current?.scrollToEnd()}
            />

            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : "height"}
              keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
              style={styles.inputContainer}
            >
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  value={currentMessage}
                  onChangeText={setCurrentMessage}
                  placeholder="Type a message..."
                  placeholderTextColor="#94a3b8"
                  multiline
                />
                <Pressable
                  onPress={sendMessage}
                  style={[
                    styles.sendButton,
                    !currentMessage.trim() && styles.sendButtonDisabled
                  ]}
                  disabled={!currentMessage.trim()}
                >
                  <Ionicons 
                    name="send" 
                    size={20} 
                    color={currentMessage.trim() ? "white" : "#94a3b8"} 
                  />
                </Pressable>
              </View>
            </KeyboardAvoidingView>
          </SafeAreaView>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, 
    backgroundColor: "#f8fafc"
  },
  header: {
    padding: 20
  },
  welcomeSection: {
    padding: 20,
    paddingBottom: 0,
  },
  welcomeText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4
  },
  usernameText: {
    fontSize: 24, 
    fontWeight: "bold", 
    color: "#2c3e50"
  },
  chatStatus: {
    fontSize: 12,
    color: '#3498db',
    marginTop: 4
  },
  chatListContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18, 
    fontWeight: "600", 
    marginBottom: 16, 
    color: "#2c3e50"
  },
  chatListContent: {
    paddingBottom: 80
  },
  chatItem: {
    width: 280,
    marginRight: 12,
    padding: 16,
    backgroundColor: "white",
    borderRadius: 12,
    marginBottom: 8,
    marginHorizontal: 2,
    boxShadow: "0px 2px 4px rgba(0,0,0,0.1)", 
    elevation: 2,
  },
  chatItemContainer: {
    flexDirection: "row", 
    alignItems: "center"
  },
  chatAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  chatAvatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#e1e8ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  chatAvatarText: {
    fontSize: 20, 
    color: '#3498db'
  },
  chatContent: {
    flex: 1
  },
  chatHeader: {
    flexDirection: "row", 
    justifyContent: "space-between", 
    alignItems: "center"
  },
  chatName: {
    fontSize: 16, 
    fontWeight: "600", 
    color: "#2c3e50"
  },
  chatTime: {
    fontSize: 12, 
    color: "#95a5a6"
  },
  chatRoleTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginTop: 4,
    alignSelf: 'flex-start',
    borderWidth: 1,
  },
  chatRoleText: {
    fontSize: 10, 
    fontWeight: '500',
    textTransform: 'capitalize'
  },
  chatMessage: {
    marginTop: 4, 
    color: "#7f8c8d"
  },
  userItem: {
    padding: 16,
    backgroundColor: "white",
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    marginVertical: 6,
    boxShadow: "0px 2px 4px rgba(0,0,0,0.15)", 
    elevation: 3,
  },
  activeUserItem: {
    borderWidth: 1,
    borderColor: '#3498db',
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  userAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e1e8ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userAvatarText: {
    fontSize: 18, 
    color: '#3498db'
  },
  userInfo: {
    flex: 1
  },
  userName: {
    fontSize: 16, 
    color: "#2c3e50", 
    fontWeight: '600'
  },
  roleTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 4,
    alignSelf: 'flex-start',
    borderWidth: 1,
  },
  teacherRoleTag: {
    backgroundColor: '#fff5f5',
    borderColor: '#feb2b2'
  },
  studentRoleTag: {
    backgroundColor: '#f0f4ff',
    borderColor: '#c3dafe'
  },
  roleTagText: {
    fontSize: 12, 
    fontWeight: '500',
    textTransform: 'capitalize'
  },
  teacherRoleText: {
    color: '#f56565'
  },
  studentRoleText: {
    color: '#3182ce'
  },
  hintText: {
    fontSize: 10, 
    color: "#7f8c8d", 
    marginTop: 4
  },
  activeChatBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#3498db',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  activeChatText: {
    color: 'white', 
    fontSize: 10
  },
  emptyStateContainer: {
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center',
    paddingBottom: 120
  },
  emptyStateTitle: {
    textAlign: "center", 
    color: "#94a3b8", 
    marginTop: 16,
    fontSize: 16
  },
  emptyStateSubtitle: {
    textAlign: "center", 
    color: "#94a3b8", 
    marginTop: 8,
    fontSize: 14,
    maxWidth: '70%'
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContainer: {
    position: 'absolute',
    right: 30,
    bottom: 30,
    borderRadius: 20,
    backgroundColor: '#f8fafc',
    width: '90%',
    maxHeight: '80%',
    padding: 20,
    paddingTop: 30,
    boxShadow: "0px 2px 8px rgba(0,0,0,0.1)", 
    elevation: 4,
  },
  closeButton: {
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
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#cbd5e1',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 25,
    marginBottom: 12,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#e1e8ff',
  },
  searchIconContainer: {
    backgroundColor: '#f0f4ff',
    padding: 8,
    borderRadius: 20,
    marginRight: 12
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#2c3e50',
    paddingVertical: 4,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#e2e8f0',
  },
  activeFilterButton: {
    backgroundColor: '#3498db',
  },
  filterText: {
    color: '#64748b',
    fontSize: 14,
    fontWeight: '500',
    textTransform: 'capitalize'
  },
  activeFilterText: {
    color: 'white',
  },
  usersList: {
    maxHeight: 400
  },
  fabContainer: {
    position: 'absolute',
    bottom: 30,
    right: 30,
  },
  fabGradient: {
    borderRadius: 30,
    boxShadow: "0px 2px 5px rgba(0,0,0,0.25)", 
    elevation: 5,
  },
  fab: {
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1, 
    justifyContent: "center", 
    alignItems: "center",
    backgroundColor: "#f8fafc"
  },
  loadingText: {
    fontSize: 16,
    color: "#64748b"
  },
  errorContainer: {
    flex: 1, 
    justifyContent: "center", 
    alignItems: "center",
    backgroundColor: "#f8fafc"
  },
  errorText: {
    fontSize: 16,
    color: "#ef4444"
  },
  mainView: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  chatPanel: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    backgroundColor: '#fff',
    zIndex: 100,
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    backgroundColor: '#fff',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  chatHeaderTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
  },
  messagesList: {
    padding: 16,
  },
  inputContainer: {
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    padding: 16,
    backgroundColor: '#fff',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 24,
    paddingHorizontal: 16,
  },
  input: {
    flex: 1,
    padding: 12,
    fontSize: 16,
    color: '#2c3e50',
  },
  sendButton: {
    backgroundColor: '#3498db',
    padding: 10,
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#e2e8f0',
  },
  messageContainer: {
    marginBottom: 12,
    padding: 10,
    borderRadius: 8,
    maxWidth: '80%',
  },
  sentMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#dcf8c6',
  },
  receivedMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  messageText: {
    fontSize: 16,
    color: '#2c3e50',
  },
  messageTimestamp: {
    fontSize: 12,
    color: '#95a5a6',
    marginTop: 4,
    textAlign: 'right',
  },
  recentSection: {
    marginBottom: 24,
  },
  recentChatsContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  userListContent: {
    paddingBottom: 100,
  },
  listHeader: {
    marginBottom: 16,
  },
});
