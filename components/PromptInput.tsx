/**
 * Prompt Input Component
 * Text input for natural language PDF requests with suggestions
 */

import React from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface PromptInputProps {
    value: string;
    onChangeText: (text: string) => void;
    subject: 'math' | 'science';
    grade: string;
    placeholder?: string;
}

const MATH_SUGGESTIONS: Record<string, string[]> = {
    K: ['Counting to 20', 'Basic shapes', 'Simple addition'],
    '1': ['Addition within 20', 'Telling time', 'Place value'],
    '2': ['Two-digit addition', 'Skip counting', 'Basic multiplication'],
    '3': ['Multiplication tables', 'Fractions introduction', 'Division basics'],
    '4': ['Long division', 'Fraction operations', 'Decimals'],
    '5': ['Adding fractions', 'Decimal operations', 'Volume'],
    '6': ['Ratios', 'Percentages', 'One-step equations'],
    '7': ['Proportions', 'Negative numbers', 'Two-step equations'],
    '8': ['Linear equations', 'Pythagorean theorem', 'Functions'],
    'Algebra 1': ['Quadratic equations', 'Factoring polynomials', 'Systems of equations'],
};

const SCIENCE_SUGGESTIONS: Record<string, string[]> = {
    '3': ['Plant life cycles', 'Weather patterns', 'Simple machines'],
    '4': ['Energy transfer', 'Animal adaptations', 'Earth changes'],
    '5': ['States of matter', 'Ecosystems', 'Solar system'],
    '6': ['Cells and organisms', 'Weather and climate', 'Earth layers'],
    '7': ['Genetics basics', 'Chemical reactions', 'Ecosystems'],
    '8': ['Forces and motion', 'Waves and sound', 'Evolution'],
};

export function PromptInput({
    value,
    onChangeText,
    subject,
    grade,
    placeholder,
}: PromptInputProps) {
    const suggestions =
        subject === 'math'
            ? MATH_SUGGESTIONS[grade] || MATH_SUGGESTIONS['4']
            : SCIENCE_SUGGESTIONS[grade] || SCIENCE_SUGGESTIONS['5'];

    const defaultPlaceholder =
        subject === 'math'
            ? 'e.g., "Multiplication tables with step-by-step examples"'
            : 'e.g., "Explain the water cycle with diagrams"';

    return (
        <View style={styles.container}>
            <Text style={styles.label}>What would you like to learn?</Text>
            <TextInput
                style={styles.input}
                value={value}
                onChangeText={onChangeText}
                placeholder={placeholder || defaultPlaceholder}
                placeholderTextColor="#6B7280"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
            />
            <View style={styles.suggestionsContainer}>
                <Text style={styles.suggestionsLabel}>Quick suggestions:</Text>
                <View style={styles.suggestions}>
                    {suggestions.map((suggestion) => (
                        <TouchableOpacity
                            key={suggestion}
                            style={styles.suggestionChip}
                            onPress={() => onChangeText(suggestion)}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.suggestionText}>{suggestion}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 24,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#9CA3AF',
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    input: {
        backgroundColor: '#1F2937',
        borderRadius: 16,
        padding: 16,
        fontSize: 16,
        color: '#FFFFFF',
        minHeight: 100,
        borderWidth: 2,
        borderColor: '#374151',
    },
    suggestionsContainer: {
        marginTop: 12,
    },
    suggestionsLabel: {
        fontSize: 12,
        color: '#6B7280',
        marginBottom: 8,
    },
    suggestions: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    suggestionChip: {
        backgroundColor: '#374151',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
    },
    suggestionText: {
        fontSize: 13,
        color: '#D1D5DB',
    },
});
