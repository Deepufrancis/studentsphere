import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function Help() {
  const router = useRouter();
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerText}>Help Center</Text>
      </View>

      {/* Quick Start Guide */}
      <TouchableOpacity 
        style={styles.section}
        onPress={() => toggleSection('quickStart')}
      >
        <View style={styles.sectionHeader}>
          <Ionicons name="rocket-outline" size={24} color="#4A90E2" />
          <Text style={styles.sectionTitle}>Quick Start Guide</Text>
          <Ionicons 
            name={expandedSection === 'quickStart' ? 'chevron-up' : 'chevron-down'} 
            size={24} 
            color="#666" 
          />
        </View>
        {expandedSection === 'quickStart' && (
          <View style={styles.sectionContent}>
            <Text style={styles.contentText}>1. Dashboard Overview</Text>
            <Text style={styles.contentDetails}>View your schedule, assignments, and announcements</Text>
            <Text style={styles.contentText}>2. Managing Classes</Text>
            <Text style={styles.contentDetails}>Create and organize your class materials</Text>
            <Text style={styles.contentText}>3. Student Progress</Text>
            <Text style={styles.contentDetails}>Track and evaluate student performance</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* FAQ Section */}
      <TouchableOpacity 
        style={styles.section}
        onPress={() => toggleSection('faq')}
      >
        <View style={styles.sectionHeader}>
          <Ionicons name="help-circle-outline" size={24} color="#4A90E2" />
          <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
          <Ionicons 
            name={expandedSection === 'faq' ? 'chevron-up' : 'chevron-down'} 
            size={24} 
            color="#666" 
          />
        </View>
        {expandedSection === 'faq' && (
          <View style={styles.sectionContent}>
            <Text style={styles.question}>How do I reset my password?</Text>
            <Text style={styles.answer}>Go to Settings > Security > Reset Password</Text>
            
            <Text style={styles.question}>How can I contact support?</Text>
            <Text style={styles.answer}>Email us at support@studentsphere.com</Text>
            
            <Text style={styles.question}>Can I export student data?</Text>
            <Text style={styles.answer}>Yes, use the export function in the class dashboard</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Contact Support */}
      <TouchableOpacity 
        style={styles.section}
        onPress={() => toggleSection('contact')}
      >
        <View style={styles.sectionHeader}>
          <Ionicons name="mail-outline" size={24} color="#4A90E2" />
          <Text style={styles.sectionTitle}>Contact Support</Text>
          <Ionicons 
            name={expandedSection === 'contact' ? 'chevron-up' : 'chevron-down'} 
            size={24} 
            color="#666" 
          />
        </View>
        {expandedSection === 'contact' && (
          <View style={styles.sectionContent}>
            <Text style={styles.contentText}>Email: support@studentsphere.com</Text>
            <Text style={styles.contentText}>Phone: 1-800-STUDENT</Text>
            <Text style={styles.contentText}>Hours: Mon-Fri 9AM-5PM EST</Text>
            <TouchableOpacity style={styles.supportButton}>
              <Text style={styles.supportButtonText}>Submit Support Ticket</Text>
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    marginRight: 16,
  },
  headerText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  section: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
  },
  sectionTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
    color: '#333',
  },
  sectionContent: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  contentText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
  },
  contentDetails: {
    fontSize: 14,
    color: '#666',
    marginLeft: 16,
    marginBottom: 12,
  },
  question: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  answer: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  supportButton: {
    backgroundColor: '#4A90E2',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  supportButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
