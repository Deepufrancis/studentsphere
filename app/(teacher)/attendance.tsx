import React, { useState, useEffect } from "react";
import { View, Text, FlatList } from "react-native";
import { API_BASE_URL } from "../constants";
import { useLocalSearchParams } from "expo-router";

const AttendanceScreen = () => {
  const { courseId } = useLocalSearchParams();
  const [students, setStudents] = useState([]);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/students/${courseId}`);
      const data = await response.json();
      setStudents(data);
    } catch (error) {
      console.error("Error fetching students", error);
    }
  };

  return (
    <View>
      <Text>Attendance Screen</Text>
      <FlatList
        data={students}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <View>
            <Text>{item.username}</Text>
          </View>
        )}
      />
    </View>
  );
};

export default AttendanceScreen;
