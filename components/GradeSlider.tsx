/**
 * Grade Slider Component
 * Select grade level with visual indicators
 */

import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface GradeSliderProps {
    subject: 'math' | 'science';
    selected: string;
    onSelect: (grade: string) => void;
}

const MATH_GRADES = ['K', '1', '2', '3', '4', '5', '6', '7', '8', 'Algebra 1'];
const SCIENCE_GRADES = ['3', '4', '5', '6', '7', '8'];

export function GradeSlider({ subject, selected, onSelect }: GradeSliderProps) {
    const grades = subject === 'math' ? MATH_GRADES : SCIENCE_GRADES;

    const getGradeLabel = (grade: string): string => {
        if (grade === 'K') return 'K';
        if (grade === 'Algebra 1') return 'Alg 1';
        return grade;
    };

    const getGradeDescription = (grade: string): string => {
        if (grade === 'K') return 'Kindergarten';
        if (grade === 'Algebra 1') return 'Algebra 1';
        return `Grade ${grade}`;
    };

    return (
        <View style={styles.container}>
            <Text style={styles.label}>Grade Level</Text>
            <Text style={styles.selectedGrade}>{getGradeDescription(selected)}</Text>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {grades.map((grade) => (
                    <TouchableOpacity
                        key={grade}
                        style={[
                            styles.gradeButton,
                            selected === grade && styles.gradeButtonSelected,
                        ]}
                        onPress={() => onSelect(grade)}
                        activeOpacity={0.7}
                    >
                        <Text
                            style={[
                                styles.gradeText,
                                selected === grade && styles.gradeTextSelected,
                            ]}
                        >
                            {getGradeLabel(grade)}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>
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
        marginBottom: 4,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    selectedGrade: {
        fontSize: 18,
        fontWeight: '700',
        color: '#FFFFFF',
        marginBottom: 12,
    },
    scrollContent: {
        paddingRight: 20,
        gap: 10,
    },
    gradeButton: {
        minWidth: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: '#1F2937',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 16,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    gradeButtonSelected: {
        backgroundColor: '#3B82F6',
        borderColor: '#60A5FA',
    },
    gradeText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#6B7280',
    },
    gradeTextSelected: {
        color: '#FFFFFF',
    },
});
