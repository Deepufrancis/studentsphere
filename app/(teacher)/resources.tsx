import { useState } from "react";
import { View, Text, FlatList, TouchableOpacity } from "react-native";
import { AntDesign } from "@expo/vector-icons";

export default function ResourcesScreen() {
  const [resources, setResources] = useState([
    { id: "1", name: "Lecture Notes - Week 1.pdf" },
    { id: "2", name: "Assignment Guidelines.docx" },
    { id: "3", name: "Project Report Template.pptx" },
  ]);

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Text style={{ fontSize: 20, fontWeight: "bold", marginBottom: 10 }}>
        Shared Resources
      </Text>

      <FlatList
        data={resources}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={{ padding: 10, borderBottomWidth: 1 }}>
            <Text>{item.name}</Text>
          </TouchableOpacity>
        )}
      />

      <TouchableOpacity
        style={{
          position: "absolute",
          bottom: 20,
          right: 20,
          backgroundColor: "#007bff",
          padding: 15,
          borderRadius: 50,
        }}
        onPress={() => console.log("Upload File Clicked")}
      >
        <AntDesign name="upload" size={24} color="white" />
      </TouchableOpacity>
    </View>
  );
}
