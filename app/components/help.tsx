import { View, Text, ScrollView, TextInput } from 'react-native';
import { useState } from 'react';
import { FontAwesome } from '@expo/vector-icons';

const HelpScreen = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const helpTopics = [
    { 
      title: 'Getting Started', 
      content: 'Sign in and explore your dashboard to access courses and assignments.',
      icon: 'rocket'
    },
    { 
      title: 'Courses', 
      content: 'Browse available courses, enroll in new ones, and track your progress through the curriculum.',
      icon: 'book'
    },
    { 
      title: 'Assignments', 
      content: 'View pending assignments, submit your work, and check grades.',
      icon: 'pencil'
    },
    { 
      title: 'Technical Support', 
      content: 'Having technical issues? Contact our support team at support@studentsphere.com or mail deepufrancis9999@gmail.com',
      icon: 'wrench'
    }
  ];

  const filteredTopics = helpTopics.filter(topic =>
    topic.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    topic.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <ScrollView className="p-4 bg-white">
      <Text className="text-2xl font-bold mb-6 text-center">Help Center</Text>
      
      <View className="mb-4 px-4 py-2 bg-gray-100 rounded-lg flex-row items-center">
        <FontAwesome name="search" size={20} color="#666" />
        <TextInput
          className="ml-2 flex-1"
          placeholder="Search help topics..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {filteredTopics.map((topic, index) => (
        <View key={index} className="mb-4 p-4 bg-gray-50 rounded-lg">
          <View className="flex-row items-center mb-2">
            <FontAwesome name={topic.icon} size={24} color="#4B5563" />
            <Text className="text-lg font-bold ml-2">{topic.title}</Text>
          </View>
          <Text className="text-gray-600">{topic.content}</Text>
        </View>
      ))}
    </ScrollView>
  );
};

export default HelpScreen;
