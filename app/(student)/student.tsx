import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, StyleSheet, Button } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Course {
    _id: string;
    courseName: string;
    description: string;
    teacher: string;
}

const Student: React.FC = () => {
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [loggedInUser, setLoggedInUser] = useState<string | null>(null);
    const [requestedCourses, setRequestedCourses] = useState<string[]>([]);

    useEffect(() => {
        const fetchLoggedInUser = async () => {
            const user = await AsyncStorage.getItem('loggedInUser');
            if (user) setLoggedInUser(user);
        };

        fetchLoggedInUser();
    }, []);

    useEffect(() => {
        if (!loggedInUser) return;

        const fetchCourses = async () => {
            try {
                const response = await fetch('http://10.10.33.76:5000/api/courses');
                if (!response.ok) throw new Error('Network response was not ok');

                const data = await response.json();
                setCourses(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchCourses();
    }, [loggedInUser]);

    const handleRequest = async (courseId: string) => {
        if (!loggedInUser) return;

        try {
            const response = await fetch('http://10.10.33.76:5000/api/requests/request', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ courseId, studentId: loggedInUser }),
            });

            if (!response.ok) throw new Error('Failed to request course');

            setRequestedCourses([...requestedCourses, courseId]);
        } catch (err) {
            console.error(err);
        }
    };

    const handleCancel = async (courseId: string) => {
        if (!loggedInUser) return;

        try {
            const response = await fetch('http://localhost:5000/api/requests/cancel', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ courseId, studentId: loggedInUser }),
            });

            if (!response.ok) throw new Error('Failed to cancel request');

            setRequestedCourses(requestedCourses.filter(id => id !== courseId));
        } catch (err) {
            console.error(err);
        }
    };

    const renderItem = ({ item }: { item: Course }) => (
        <View style={styles.item}>
            <Text style={styles.title}>{item.courseName}</Text>
            <Text style={styles.description}>{item.description}</Text>
            <Text style={styles.teacher}>Teacher: {item.teacher}</Text>
            
            {requestedCourses.includes(item._id) ? (
                <Button title="Cancel" onPress={() => handleCancel(item._id)} color="red" />
            ) : (
                <Button title="Request" onPress={() => handleRequest(item._id)} />
            )}
        </View>
    );

    if (loading) return <ActivityIndicator size="large" color="#0000ff" />;

    return (
        <View style={styles.container}>
            <Text style={styles.header}>Available Courses</Text>
            {error && <Text style={styles.error}>Error: {error}</Text>}
            <FlatList
                data={courses}
                renderItem={renderItem}
                keyExtractor={(item) => item._id}
                ListEmptyComponent={<Text>No courses found.</Text>}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, backgroundColor: '#fff' },
    header: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
    item: { padding: 15, borderBottomWidth: 1, borderBottomColor: '#ccc' },
    title: { fontSize: 18, fontWeight: 'bold' },
    description: { fontSize: 14, color: '#555' },
    teacher: { fontSize: 14, fontStyle: 'italic' },
    error: { color: 'red', marginBottom: 10 },
});

export default Student;
