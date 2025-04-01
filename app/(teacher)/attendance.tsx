import { useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { API_BASE_URL } from "../constants";
import { useRouter } from "expo-router";

const Attendance = () => {
    const [teacherName, setTeacherName] = useState<string | null>(null);
    const [courses, setCourses] = useState<{ _id: string; courseName: string }[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    useEffect(() => {
        const fetchTeacherData = async () => {
            try {
                const name = await AsyncStorage.getItem("loggedInUser");
                if (name) {
                    setTeacherName(name);
                    fetchCourses(name);
                }
            } catch (error) {
                setError("Error retrieving teacher name.");
            }
        };

        const fetchCourses = async (teacherUsername: string) => {
            try {
                const response = await axios.get(`${API_BASE_URL}/courses?teacher=${teacherUsername}`);
                setCourses(response.data);
            } catch (err) {
                setError("Failed to fetch courses. Please try again.");
            } finally {
                setLoading(false);
            }
        };

        fetchTeacherData();
    }, []);

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Mark Attendance</Text>
            {teacherName && <Text style={styles.teacher}>Teacher: {teacherName}</Text>}

            {loading ? (
                <ActivityIndicator size="large" color="#007AFF" />
            ) : error ? (
                <Text style={styles.error}>{error}</Text>
            ) : (
                <>
                    <Text style={styles.subtitle}>Select a Course:</Text>
                    <FlatList
                        data={courses}
                        keyExtractor={(item) => item._id}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={styles.courseItem}
                                onPress={() => router.push(`/attendanceMarker?courseId=${item._id}&courseName=${item.courseName}`)}
                            >
                                <Text style={styles.course}>{item.courseName}</Text>
                            </TouchableOpacity>
                        )}
                    />
                </>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#f5f5f5',
    },
    title: {
        fontSize: 28,
        fontWeight: "bold",
        color: '#2c3e50',
        textAlign: 'center',
        marginVertical: 20,
    },
    teacher: {
        fontSize: 18,
        color: '#34495e',
        marginBottom: 20,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 20,
        marginVertical: 15,
        color: '#2c3e50',
        fontWeight: '600',
        textAlign: 'center',
    },
    courseItem: {
        backgroundColor: 'white',
        padding: 20,
        marginVertical: 8,
        marginHorizontal: 16,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.23,
        shadowRadius: 2.62,
        elevation: 4,
    },
    course: {
        fontSize: 18,
        color: '#2c3e50',
        textAlign: 'center',
    },
    error: {
        color: '#e74c3c',
        textAlign: 'center',
        marginTop: 15,
        fontSize: 16,
    },
});

export default Attendance;
