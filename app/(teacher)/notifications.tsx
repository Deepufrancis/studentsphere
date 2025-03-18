import { View, Text, FlatList } from "react-native";

const notifications = [
  { id: "1", message: "New assignment added for Math 101.", time: "2h ago" },
  { id: "2", message: "Your course registration request was approved.", time: "5h ago" },
  { id: "3", message: "Reminder: Assignment due tomorrow!", time: "1d ago" },
];

export default function NotificationScreen() {
  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Text style={{ fontSize: 24, fontWeight: "bold", marginBottom: 10 }}>Notifications</Text>
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={{ padding: 15, backgroundColor: "#f9f9f9", marginBottom: 10, borderRadius: 10 }}>
            <Text style={{ fontSize: 16 }}>{item.message}</Text>
            <Text style={{ fontSize: 12, color: "gray" }}>{item.time}</Text>
          </View>
        )}
      />
    </View>
  );
}
