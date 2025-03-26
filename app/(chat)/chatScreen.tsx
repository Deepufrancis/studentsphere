import { useEffect, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, FlatList } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { io } from "socket.io-client";
import { API_BASE_URL } from "../constants";

export default function ChatScreen() {
  const { username } = useLocalSearchParams();
  const [socket, setSocket] = useState<any>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<{ sender: string; message: string }[]>([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    console.log("Attempting to connect to:", API_BASE_URL);
    const newSocket = io(API_BASE_URL, {
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 10000,
      transports: ['websocket', 'polling'],
      forceNew: true
    });

    newSocket.on("connect", () => {
      console.log("Socket connected successfully");
      setIsConnected(true);
      const chatRoom = `chat_${username}`;
      newSocket.emit("joinRoom", chatRoom);
    });

    newSocket.on("disconnect", () => {
      console.log("Socket disconnected");
      setIsConnected(false);
    });

    newSocket.on("connect_error", (error) => {
      console.error("Socket connection error:", error.message);
      setIsConnected(false);
    });

    newSocket.on("error", (error) => {
      console.error("Socket error:", error);
      alert("Chat error: " + error);
    });

    setSocket(newSocket);

    newSocket.on("chatHistory", (history) => {
      if (Array.isArray(history)) {
        setMessages(history);
      }
    });

    newSocket.on("receiveMessage", (data) => {
      if (data && data.sender && data.message) {
        setMessages((prevMessages) => [...prevMessages, data]);
      }
    });

    return () => {
      if (newSocket) {
        newSocket.close();
      }
    };
  }, [username]);

  const sendMessage = () => {
    if (!isConnected || !socket) {
      alert("Not connected to chat server");
      return;
    }

    if (message.trim() !== "") {
      const chatRoom = `chat_${username}`;
      const messageData = { room: chatRoom, sender: username, message: message.trim() };
      
      try {
        socket.emit("sendMessage", messageData, (acknowledgement: any) => {
          if (!acknowledgement?.success) {
            console.error("Send message failed:", acknowledgement?.error);
            alert("Failed to send message");
          }
        });
        setMessage("");
      } catch (error) {
        console.error("Error sending message:", error);
        alert("Error sending message");
      }
    }
  };

  return (
    <View style={{ flex: 1, padding: 20, backgroundColor: "#f5f5f5" }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 }}>
        <Text style={{ fontSize: 20, fontWeight: "bold" }}>Chat with {username}</Text>
        <View style={{ 
          width: 10, 
          height: 10, 
          borderRadius: 5, 
          backgroundColor: isConnected ? "#2ecc71" : "#e74c3c" 
        }} />
      </View>
      {!isConnected && (
        <Text style={{ color: '#e74c3c', textAlign: 'center', marginBottom: 10 }}>
          Connecting to chat server...
        </Text>
      )}

      <FlatList
        data={messages}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => (
          <View
            style={{
              padding: 10,
              backgroundColor: item.sender === username ? "#3498db" : "#95a5a6",
              alignSelf: item.sender === username ? "flex-end" : "flex-start",
              borderRadius: 10,
              marginVertical: 5,
            }}
          >
            <Text style={{ color: "white", fontSize: 12 }}>{item.sender}</Text>
            <Text style={{ color: "white" }}>{item.message}</Text>
          </View>
        )}
      />

      <View style={{ flexDirection: "row", alignItems: "center", marginTop: 10 }}>
        <TextInput
          style={{
            flex: 1,
            borderWidth: 1,
            borderColor: "#ddd",
            padding: 10,
            borderRadius: 5,
            backgroundColor: "white",
          }}
          value={message}
          onChangeText={setMessage}
          placeholder="Type a message..."
        />
        <TouchableOpacity
          onPress={sendMessage}
          style={{
            marginLeft: 10,
            backgroundColor: "#2ecc71",
            padding: 10,
            borderRadius: 5,
          }}
        >
          <Text style={{ color: "white", fontWeight: "bold" }}>Send</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
