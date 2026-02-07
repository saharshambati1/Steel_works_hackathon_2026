import { storageService, StoredPDF } from '@/services/storage';
import { useFocusEffect } from 'expo-router';
import * as Sharing from 'expo-sharing';
import React, { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ExploreScreen() {
    const [pdfs, setPdfs] = useState<StoredPDF[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadPDFs = async () => {
        try {
            const storedPDFs = await storageService.getAllPDFs();
            setPdfs(storedPDFs);
        } catch (error) {
            console.error('Error loading PDFs:', error);
            Alert.alert('Error', 'Failed to load your library.');
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadPDFs();
        }, [])
    );

    const onRefresh = () => {
        setRefreshing(true);
        loadPDFs();
    };

    const handleShare = async (pdf: StoredPDF) => {
        try {
            const isAvailable = await Sharing.isAvailableAsync();
            if (!isAvailable) {
                Alert.alert('Not Available', 'Sharing is not available on this device');
                return;
            }

            await Sharing.shareAsync(pdf.filePath, {
                mimeType: 'application/pdf',
                dialogTitle: `Share ${pdf.title}`,
                UTI: 'com.adobe.pdf',
            });
        } catch (error) {
            console.error('Error sharing file:', error);
            Alert.alert('Share Failed', 'Could not share this PDF.');
        }
    };

    const handleDelete = async (pdf: StoredPDF) => {
        Alert.alert(
            'Delete PDF',
            `Are you sure you want to delete "${pdf.title}"?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await storageService.deletePDF(pdf.id);
                            loadPDFs(); // Reload list
                        } catch (error) {
                            Alert.alert('Error', 'Failed to delete PDF.');
                        }
                    },
                },
            ]
        );
    };

    const renderItem = ({ item }: { item: StoredPDF }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <View style={styles.iconContainer}>
                    <Text style={styles.icon}>{item.subject === 'math' ? '➗' : '🧬'}</Text>
                </View>
                <View style={styles.cardContent}>
                    <Text style={styles.cardTitle} numberOfLines={2}>
                        {item.title}
                    </Text>
                    <Text style={styles.cardSubtitle}>
                        {item.subject.charAt(0).toUpperCase() + item.subject.slice(1)} • Grade {item.grade}
                    </Text>
                    <Text style={styles.cardDate}>
                        {new Date(item.createdAt).toLocaleDateString()}
                    </Text>
                </View>
            </View>

            <View style={styles.cardActions}>
                <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleShare(item)}
                >
                    <Text style={styles.actionButtonText}>Share PDF</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.actionButton, styles.deleteButton]}
                    onPress={() => handleDelete(item)}
                >
                    <Text style={[styles.actionButtonText, styles.deleteButtonText]}>Delete</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <Text style={styles.logo}>🎓 MeshMind</Text>
                <Text style={styles.title}>My Library</Text>
                <Text style={styles.subtitle}>Your generated worksheets</Text>
            </View>

            {isLoading ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color="#3B82F6" />
                </View>
            ) : (
                <FlatList
                    data={pdfs}
                    keyExtractor={(item) => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor="#FFFFFF"
                            colors={['#3B82F6']}
                        />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyIcon}>📂</Text>
                            <Text style={styles.emptyTitle}>No PDFs yet</Text>
                            <Text style={styles.emptyText}>
                                Go to the Create tab to generate your first worksheet!
                            </Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#111827',
    },
    header: {
        paddingHorizontal: 20,
        marginBottom: 20,
        marginTop: 10,
    },
    logo: {
        fontSize: 20,
        fontWeight: '800',
        color: '#3B82F6',
        marginBottom: 4,
    },
    title: {
        fontSize: 32,
        fontWeight: '800',
        color: '#FFFFFF',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 16,
        color: '#9CA3AF',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        padding: 20,
        paddingTop: 0,
        paddingBottom: 40,
    },
    card: {
        backgroundColor: '#1F2937',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#374151',
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    iconContainer: {
        width: 48,
        height: 48,
        backgroundColor: '#374151',
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    icon: {
        fontSize: 24,
    },
    cardContent: {
        flex: 1,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#FFFFFF',
        marginBottom: 4,
    },
    cardSubtitle: {
        fontSize: 14,
        color: '#D1D5DB',
        marginBottom: 4,
    },
    cardDate: {
        fontSize: 12,
        color: '#9CA3AF',
    },
    cardActions: {
        flexDirection: 'row',
        gap: 12,
    },
    actionButton: {
        flex: 1,
        backgroundColor: '#374151',
        paddingVertical: 10,
        borderRadius: 8,
        alignItems: 'center',
    },
    actionButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    deleteButton: {
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
    },
    deleteButtonText: {
        color: '#EF4444',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 60,
    },
    emptyIcon: {
        fontSize: 48,
        marginBottom: 16,
        opacity: 0.5,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#FFFFFF',
        marginBottom: 8,
    },
    emptyText: {
        fontSize: 16,
        color: '#9CA3AF',
        textAlign: 'center',
        paddingHorizontal: 40,
    },
});
