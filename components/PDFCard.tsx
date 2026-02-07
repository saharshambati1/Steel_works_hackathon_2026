/**
 * PDF Card Component
 * Displays a generated PDF with actions for viewing and sharing
 */

import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface PDFCardProps {
    id: string;
    title: string;
    subject: 'math' | 'science';
    grade: string;
    createdAt: string;
    fileSize?: number;
    onView?: () => void;
    onShare?: () => void;
    onDelete?: () => void;
}

export function PDFCard({
    id,
    title,
    subject,
    grade,
    createdAt,
    fileSize,
    onView,
    onShare,
    onDelete,
}: PDFCardProps) {
    const formatDate = (dateString: string): string => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const formatFileSize = (bytes?: number): string => {
        if (!bytes) return '';
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    const subjectEmoji = subject === 'math' ? '📐' : '🔬';
    const subjectColor = subject === 'math' ? '#3B82F6' : '#10B981';

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={[styles.subjectBadge, { backgroundColor: subjectColor }]}>
                    <Text style={styles.subjectText}>
                        {subjectEmoji} {subject.toUpperCase()}
                    </Text>
                </View>
                <Text style={styles.grade}>Grade {grade}</Text>
            </View>

            <Text style={styles.title} numberOfLines={2}>
                {title}
            </Text>

            <View style={styles.meta}>
                <Text style={styles.metaText}>{formatDate(createdAt)}</Text>
                {fileSize && <Text style={styles.metaText}>• {formatFileSize(fileSize)}</Text>}
            </View>

            <View style={styles.actions}>
                {onView && (
                    <TouchableOpacity style={styles.actionButton} onPress={onView} activeOpacity={0.7}>
                        <Text style={styles.actionText}>📄 View</Text>
                    </TouchableOpacity>
                )}
                {onShare && (
                    <TouchableOpacity
                        style={[styles.actionButton, styles.shareButton]}
                        onPress={onShare}
                        activeOpacity={0.7}
                    >
                        <Text style={[styles.actionText, styles.shareText]}>📡 Share</Text>
                    </TouchableOpacity>
                )}
                {onDelete && (
                    <TouchableOpacity style={styles.deleteButton} onPress={onDelete} activeOpacity={0.7}>
                        <Text style={styles.deleteText}>🗑️</Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#1F2937',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#374151',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    subjectBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    subjectText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#FFFFFF',
        letterSpacing: 0.5,
    },
    grade: {
        fontSize: 13,
        color: '#9CA3AF',
        fontWeight: '500',
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        color: '#FFFFFF',
        marginBottom: 8,
        lineHeight: 24,
    },
    meta: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 16,
    },
    metaText: {
        fontSize: 12,
        color: '#6B7280',
    },
    actions: {
        flexDirection: 'row',
        gap: 10,
    },
    actionButton: {
        flex: 1,
        backgroundColor: '#374151',
        paddingVertical: 10,
        borderRadius: 10,
        alignItems: 'center',
    },
    actionText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#D1D5DB',
    },
    shareButton: {
        backgroundColor: '#3B82F6',
    },
    shareText: {
        color: '#FFFFFF',
    },
    deleteButton: {
        width: 44,
        backgroundColor: '#374151',
        paddingVertical: 10,
        borderRadius: 10,
        alignItems: 'center',
    },
    deleteText: {
        fontSize: 16,
    },
});
