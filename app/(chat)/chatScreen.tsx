import { useEffect, useState, useRef } from "react";
import { View, Text, TextInput, TouchableOpacity, FlatList, SafeAreaView, KeyboardAvoidingView, Platform, Alert, Pressable } from "react-native";
import { useLocalSearchParams } from "expo-router";
import axios from "axios";
import { API_BASE_URL } from "../constants";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';

export default function ChatScreen() {
  const { username } = useLocalSearchParams();
  const [messages, setMessages] = useState<{ sender: string; message: string, timestamp?: string, _id?: string }[]>([]);
  const [message, setMessage] = useState("");
  const [loggedInUser, setLoggedInUser] = useState<string>("");
  const flatListRef = useRef<FlatList>(null);
  const [selectedMessage, setSelectedMessage] = useState<string | null>(null);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const storedUsername = await AsyncStorage.getItem("loggedInUser");
        if (storedUsername) {
          setLoggedInUser(storedUsername);
          const response = await axios.get(`${API_BASE_URL}/chat/${storedUsername}/${username}`);
          setMessages(response.data);
        }
      } catch (error) {
        console.error("Error fetching messages:", error);
      }
    };

    fetchMessages();
  }, [username]);

  const sendMessage = async () => {
    if (message.trim() !== "") {
      const newMessage = { sender: loggedInUser, receiver: username, message: message.trim() };
      try {
        await axios.post(`${API_BASE_URL}/chat/send`, newMessage);
        setMessages((prevMessages) => [...prevMessages, newMessage]);
        setMessage("");
      } catch (error) {
        console.error("Error sending message:", error);
      }
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    Alert.alert(
      "Delete Message",
      "Are you sure you want to delete this message?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await axios.delete(`${API_BASE_URL}/chat/${loggedInUser}/${username}/messages/${messageId}`);
              setMessages(messages.filter(msg => msg._id !== messageId));
            } catch (error) {
              console.error("Error deleting message:", error);
              Alert.alert("Error", "Failed to delete message");
            }
          }
        }
      ]
    );
  };

  const deleteMessage = async (messageId: string) => {
    try {
      await axios.delete(`${API_BASE_URL}/chat/${loggedInUser}/${username}/messages/${messageId}`);
      setMessages(messages.filter(msg => msg._id !== messageId));
      setSelectedMessageId(null);
    } catch (error) {
      console.error("Error deleting message:", error);
    }
  };

  const scrollToBottom = () => {
    if (flatListRef.current && messages.length > 0) {
      flatListRef.current.scrollToEnd({ animated: true });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const renderMessage = ({ item }: { item: any }) => (
    <View style={{ marginBottom: 12 }}>
      <Pressable
        onLongPress={() => {
          if (item.sender === loggedInUser) {
            setSelectedMessageId(item._id);
          }
        }}
        onPress={() => setSelectedMessageId(null)}
        style={{
          maxWidth: '80%',
          alignSelf: item.sender === loggedInUser ? "flex-end" : "flex-start",
        }}
      >
        {selectedMessageId === item._id && item.sender === loggedInUser && (
          <TouchableOpacity
            onPress={() => deleteMessage(item._id)}
            style={{
              position: 'absolute',
              top: -20,
              right: item.sender === loggedInUser ? 0 : undefined,
              left: item.sender === loggedInUser ? undefined : 0,
              backgroundColor: '#ff4757',
              borderRadius: 12,
              padding: 4,
              zIndex: 1,
            }}
          >
            <Ionicons name="trash-outline" size={16} color="white" />
          </TouchableOpacity>
        )}
        <View style={{
          backgroundColor: item.sender === loggedInUser ? "#3498db" : "#f8fafc",
          padding: 12,
          borderRadius: 16,
          borderBottomRightRadius: item.sender === loggedInUser ? 4 : 16,
          borderBottomLeftRadius: item.sender === loggedInUser ? 16 : 4,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.1,
          shadowRadius: 2,
          elevation: 2,
        }}>
          <Text style={{ 
            color: item.sender === loggedInUser ? "white" : "#2c3e50",
            fontSize: 16,
          }}>
            {item.message}
          </Text>
        </View>
        <Text style={{ 
          fontSize: 11,
          color: "#94a3b8",
          marginTop: 4,
          marginLeft: item.sender === loggedInUser ? 0 : 4,
          marginRight: item.sender === loggedInUser ? 4 : 0,
          textAlign: item.sender === loggedInUser ? 'right' : 'left'
        }}>
          {item.timestamp ? format(new Date(item.timestamp), 'h:mm a') : ''}
        </Text>
      </Pressable>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f8fafc" }}>
      {/* Simplified Header */}
      <View style={{ 
        padding: 16,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
        flexDirection: 'row',
        alignItems: 'center'
      }}>
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
            {String(username).charAt(0).toUpperCase()}
          </Text>
        </View>
        <Text style={{ 
          fontSize: 18, 
          fontWeight: "600", 
          color: "#2c3e50",
          flex: 1 
        }}>
          {username}
        </Text>
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item, index) => index.toString()}
        contentContainerStyle={{ padding: 16 }}
        renderItem={renderMessage}
        onContentSizeChange={scrollToBottom}
      />

      {/* Input Area */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
        style={{
          borderTopWidth: 1,
          borderTopColor: '#e2e8f0',
          padding: 16,
          backgroundColor: 'white',
        }}
      >
        <View style={{ 
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: "#f8fafc",
          borderRadius: 24,
          paddingHorizontal: 16,
        }}>
          <TextInput
            style={{
              flex: 1,
              padding: 12,
              fontSize: 16,
              color: '#2c3e50',
            }}
            value={message}
            onChangeText={setMessage}
            placeholder="Type a message..."
            placeholderTextColor="#94a3b8"
            multiline
          />
          <TouchableOpacity
            onPress={sendMessage}
            style={{
              backgroundColor: message.trim() ? "#3498db" : "#e2e8f0",
              padding: 10,
              borderRadius: 20,
              width: 40,
              height: 40,
              justifyContent: 'center',
              alignItems: 'center',
            }}
            disabled={!message.trim()}
          >
            <Ionicons 
              name="send" 
              size={20} 
              color={message.trim() ? "white" : "#94a3b8"} 
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
