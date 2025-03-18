import { View, Text, FlatList, ActivityIndicator, RefreshControl } from "react-native";
import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "../constants";

export default function NotificationScreen() {
  interface Notification {
    _id: string;
    message: string;
    createdAt: string;
    read: boolean;
  }

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchNotifications();
    // Set up auto-refresh every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const userId = await AsyncStorage.getItem("userId");
      const token = await AsyncStorage.getItem("token");

      const response = await fetch(`${API_BASE_URL}/notifications/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }
      const data = await response.json();
      setNotifications(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      setError("Failed to load notifications");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
  }

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Text style={{ fontSize: 24, fontWeight: "bold", marginBottom: 10 }}>Notifications</Text>
      {notifications.length === 0 ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <Text style={{ fontSize: 16, color: "#666" }}>No notifications yet</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <View style={{ 
              padding: 15, 
              backgroundColor: item.read ? "#f9f9f9" : "#e3f2fd", 
              marginBottom: 10, 
              borderRadius: 10 
            }}>
              <Text style={{ fontSize: 16 }}>
                {item.message}{" "}
                {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
              </Text>
            </View>
          )}
        />
      )}
    </View>
  );
}
