/**
 * Subject Selector Component
 * Toggle between Math and Science with animated styling
 */

import React from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface SubjectSelectorProps {
    selected: 'math' | 'science';
    onSelect: (subject: 'math' | 'science') => void;
}

export function SubjectSelector({ selected, onSelect }: SubjectSelectorProps) {
    const animatedValue = React.useRef(new Animated.Value(selected === 'math' ? 0 : 1)).current;

    React.useEffect(() => {
        Animated.spring(animatedValue, {
            toValue: selected === 'math' ? 0 : 1,
            useNativeDriver: false,
            friction: 8,
        }).start();
    }, [selected]);

    const backgroundPosition = animatedValue.interpolate({
        inputRange: [0, 1],
        outputRange: ['0%', '50%'],
    });

    return (
        <View style={styles.container}>
            <Text style={styles.label}>Select Subject</Text>
            <View style={styles.toggleContainer}>
                <Animated.View
                    style={[
                        styles.slider,
                        {
                            left: backgroundPosition,
                        },
                    ]}
                />
                <TouchableOpacity
                    style={styles.option}
                    onPress={() => onSelect('math')}
                    activeOpacity={0.7}
                >
                    <Text style={[styles.optionText, selected === 'math' && styles.selectedText]}>
                        📐 Math
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.option}
                    onPress={() => onSelect('science')}
                    activeOpacity={0.7}
                >
                    <Text style={[styles.optionText, selected === 'science' && styles.selectedText]}>
                        🔬 Science
                    </Text>
                </TouchableOpacity>
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
    toggleContainer: {
        flexDirection: 'row',
        backgroundColor: '#1F2937',
        borderRadius: 16,
        padding: 4,
        position: 'relative',
    },
    slider: {
        position: 'absolute',
        width: '50%',
        height: '100%',
        backgroundColor: '#3B82F6',
        borderRadius: 14,
        top: 4,
    },
    option: {
        flex: 1,
        paddingVertical: 14,
        alignItems: 'center',
        zIndex: 1,
    },
    optionText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#6B7280',
    },
    selectedText: {
        color: '#FFFFFF',
    },
});
