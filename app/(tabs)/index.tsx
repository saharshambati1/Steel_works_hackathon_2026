/**
 * Create Tab - Main PDF Generation Screen
 * Users select subject, grade, enter prompt, and generate educational PDFs
 */

import { GradeSlider } from '@/components/GradeSlider';
import { PromptInput } from '@/components/PromptInput';
import { SubjectSelector } from '@/components/SubjectSelector';
import { apiService, GeneratePDFResponse } from '@/services/api';
import { storageService } from '@/services/storage';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function CreateScreen() {
  const [subject, setSubject] = useState<'math' | 'science'>('math');
  const [grade, setGrade] = useState('4');
  const [prompt, setPrompt] = useState('');
  const [includeAnswers, setIncludeAnswers] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastGenerated, setLastGenerated] = useState<GeneratePDFResponse | null>(null);

  const handleSubjectChange = (newSubject: 'math' | 'science') => {
    setSubject(newSubject);
    // Reset grade to valid default for the subject
    if (newSubject === 'science' && ['K', '1', '2', 'Algebra 1'].includes(grade)) {
      setGrade('5');
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      Alert.alert('Missing Prompt', 'Please enter what you would like to learn about.');
      return;
    }

    setIsGenerating(true);
    setLastGenerated(null);

    try {
      // Check backend health first
      const isHealthy = await apiService.healthCheck();
      if (!isHealthy) {
        throw new Error('Backend server is not reachable. Make sure it is running.');
      }

      // Generate PDF
      const response = await apiService.generatePDF({
        prompt: prompt.trim(),
        subject,
        grade,
        include_answers: includeAnswers,
      });

      if (response.success && response.pdf_base64) {
        // Save PDF locally
        const storedPDF = await storageService.savePDF(response.pdf_base64, {
          id: response.pdf_id,
          filename: response.filename,
          title: response.title,
          subject,
          grade,
          createdAt: response.created_at,
        });




        // Get file path
        await Sharing.shareAsync(storedPDF.filePath);


        // Save recent prompt
        await storageService.addRecentPrompt(prompt.trim());
        await storageService.savePreferences({
          lastSubject: subject,
          lastGrade: grade,
          includeAnswers,
        });

        setLastGenerated(response);
        setPrompt('');

        Alert.alert(
          '✅ PDF Generated!',
          `"${response.title}" has been created and saved to your library.`,
          [{ text: 'Great!', style: 'default' }]
        );
      } else {
        throw new Error(response.message || 'PDF generation failed');
      }
    } catch (error: any) {
      console.error('Generation error:', error);
      Alert.alert(
        'Generation Failed',
        error.message || 'Something went wrong. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.logo}>🎓 MeshMind</Text>
            <Text style={styles.title}>Create Educational PDF</Text>
            <Text style={styles.subtitle}>
              Generate personalized worksheets powered by AI
            </Text>
          </View>

          {/* Subject Selector */}
          <SubjectSelector selected={subject} onSelect={handleSubjectChange} />

          {/* Grade Selector */}
          <GradeSlider subject={subject} selected={grade} onSelect={setGrade} />

          {/* Prompt Input */}
          <PromptInput
            value={prompt}
            onChangeText={setPrompt}
            subject={subject}
            grade={grade}
          />

          {/* Options */}
          <View style={styles.optionsContainer}>
            <TouchableOpacity
              style={styles.optionRow}
              onPress={() => setIncludeAnswers(!includeAnswers)}
              activeOpacity={0.7}
            >
              <Text style={styles.optionLabel}>Include Answer Key</Text>
              <View style={[styles.checkbox, includeAnswers && styles.checkboxChecked]}>
                {includeAnswers && <Text style={styles.checkmark}>✓</Text>}
              </View>
            </TouchableOpacity>
          </View>

          {/* Generate Button */}
          <TouchableOpacity
            style={[styles.generateButton, isGenerating && styles.generateButtonDisabled]}
            onPress={handleGenerate}
            disabled={isGenerating}
            activeOpacity={0.8}
          >
            {isGenerating ? (
              <View style={styles.generatingContent}>
                <ActivityIndicator size="small" color="#FFFFFF" />
                <Text style={styles.generateButtonText}>Generating PDF...</Text>
              </View>
            ) : (
              <View style={styles.generatingContent}>
                <Text style={styles.generateButtonIcon}>✨</Text>
                <Text style={styles.generateButtonText}>Generate PDF</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Last Generated Info */}
          {lastGenerated && (
            <View style={styles.lastGeneratedCard}>
              <Text style={styles.lastGeneratedTitle}>✅ Just Created:</Text>
              <Text style={styles.lastGeneratedName}>{lastGenerated.title}</Text>
              <Text style={styles.lastGeneratedHint}>
                Check the Library tab to view and share!
              </Text>
            </View>
          )}

          {/* Footer Info */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              📚 Content is age-appropriate and curriculum-aligned
            </Text>
            <Text style={styles.footerText}>
              📡 Share via Bluetooth in the Library tab
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 32,
  },
  logo: {
    fontSize: 24,
    fontWeight: '800',
    color: '#3B82F6',
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#9CA3AF',
  },
  optionsContainer: {
    marginBottom: 24,
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1F2937',
    padding: 16,
    borderRadius: 12,
  },
  optionLabel: {
    fontSize: 16,
    color: '#D1D5DB',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#6B7280',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  generateButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  generateButtonDisabled: {
    backgroundColor: '#6B7280',
    shadowOpacity: 0,
  },
  generatingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  generateButtonIcon: {
    fontSize: 20,
  },
  generateButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  lastGeneratedCard: {
    backgroundColor: '#064E3B',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#10B981',
  },
  lastGeneratedTitle: {
    fontSize: 14,
    color: '#6EE7B7',
    marginBottom: 4,
  },
  lastGeneratedName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  lastGeneratedHint: {
    fontSize: 13,
    color: '#A7F3D0',
  },
  footer: {
    marginTop: 16,
    gap: 8,
  },
  footerText: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
  },
});
