import { useEffect, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, ScrollView } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { API_BASE_URL } from "../constants";
import { useRouter } from "expo-router";

const Attendance = () => {
    const [courses, setCourses] = useState<{ _id: string; courseName: string }[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    useEffect(() => {
        const fetchCourses = async () => {
            try {
                const teacher = await AsyncStorage.getItem("loggedInUser");
                const response = await axios.get(`${API_BASE_URL}/courses?teacher=${teacher}`);
                setCourses(response.data);
            } catch (err) {
                setError("Failed to fetch courses. Please try again.");
            } finally {
                setLoading(false);
            }
        };

        fetchCourses();
    }, []);

    return (
        <View style={styles.container}>
            <View style={styles.headerContainer}>
                <Text style={styles.title}>Mark Attendance</Text>
                <Text style={styles.subtitle}>Select a course to mark attendance</Text>
            </View>

            {loading ? (
                <ActivityIndicator size="large" color="#007AFF" style={styles.loader} />
            ) : error ? (
                <Text style={styles.error}>{error}</Text>
            ) : (
                <ScrollView 
                    contentContainerStyle={styles.courseContainer}
                    showsVerticalScrollIndicator={false}
                >
                    {courses.map((item) => (
                        <TouchableOpacity
                            key={item._id}
                            style={styles.coursePill}
                            onPress={() => router.push(`/attendanceMarker?courseId=${item._id}&courseName=${item.courseName}`)}
                        >
                            <Text style={styles.coursePillText}>{item.courseName}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    headerContainer: {
        backgroundColor: '#fff',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#e9ecef',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 3,
    },
    title: {
        fontSize: 28,
        fontWeight: "700",
        color: '#1a1a1a',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#6c757d',
        fontWeight: '400',
    },
    loader: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    courseContainer: {
        padding: 20,
        paddingTop: 10,
    },
    coursePill: {
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderRadius: 12,
        backgroundColor: '#fff',
        marginVertical: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 3,
        borderWidth: 1,
        borderColor: '#e9ecef',
    },
    coursePillText: {
        color: '#1a1a1a',
        fontWeight: '600',
        fontSize: 16,
        textAlign: 'center',
    },
    error: {
        color: '#dc3545',
        textAlign: 'center',
        marginTop: 20,
        fontSize: 16,
        padding: 20,
    },
});

export default Attendance;
