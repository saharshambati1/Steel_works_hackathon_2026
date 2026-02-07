/**
 * Bluetooth Device List Component
 * Shows discovered Bluetooth devices with PDFs available for sharing
 */

import type { BluetoothDevice, BluetoothPDF, TransferProgress } from '@/services/bluetooth';
import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface BluetoothDeviceListProps {
    devices: BluetoothDevice[];
    isScanning: boolean;
    onScan: () => void;
    onDownload: (device: BluetoothDevice, pdf: BluetoothPDF) => void;
    transferProgress?: { deviceId: string; pdfId: string; progress: TransferProgress };
}

export function BluetoothDeviceList({
    devices,
    isScanning,
    onScan,
    onDownload,
    transferProgress,
}: BluetoothDeviceListProps) {
    const getSignalStrength = (rssi?: number): string => {
        if (!rssi) return '📶';
        if (rssi > -50) return '📶📶📶';
        if (rssi > -70) return '📶📶';
        return '📶';
    };

    const formatFileSize = (bytes: number): string => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    const isDownloading = (deviceId: string, pdfId: string): boolean => {
        return (
            transferProgress?.deviceId === deviceId &&
            transferProgress?.pdfId === pdfId &&
            transferProgress?.progress.status === 'transferring'
        );
    };

    const getProgressPercent = (deviceId: string, pdfId: string): number => {
        if (transferProgress?.deviceId === deviceId && transferProgress?.pdfId === pdfId) {
            return transferProgress.progress.progress;
        }
        return 0;
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>📡 Nearby Devices</Text>
                <TouchableOpacity
                    style={[styles.scanButton, isScanning && styles.scanningButton]}
                    onPress={onScan}
                    disabled={isScanning}
                    activeOpacity={0.7}
                >
                    {isScanning ? (
                        <>
                            <ActivityIndicator size="small" color="#FFFFFF" />
                            <Text style={styles.scanButtonText}>Scanning...</Text>
                        </>
                    ) : (
                        <Text style={styles.scanButtonText}>Scan</Text>
                    )}
                </TouchableOpacity>
            </View>

            {devices.length === 0 ? (
                <View style={styles.emptyState}>
                    <Text style={styles.emptyIcon}>📱</Text>
                    <Text style={styles.emptyText}>
                        {isScanning ? 'Looking for nearby devices...' : 'No devices found'}
                    </Text>
                    {!isScanning && (
                        <Text style={styles.emptyHint}>Tap "Scan" to find nearby MeshMind users</Text>
                    )}
                </View>
            ) : (
                <View style={styles.deviceList}>
                    {devices.map((device) => (
                        <View key={device.id} style={styles.deviceCard}>
                            <View style={styles.deviceHeader}>
                                <View>
                                    <Text style={styles.deviceName}>{device.name}</Text>
                                    <Text style={styles.signalStrength}>{getSignalStrength(device.rssi)}</Text>
                                </View>
                                {device.isHub && (
                                    <View style={styles.hubBadge}>
                                        <Text style={styles.hubText}>HUB</Text>
                                    </View>
                                )}
                            </View>

                            {device.availablePDFs && device.availablePDFs.length > 0 && (
                                <View style={styles.pdfList}>
                                    {device.availablePDFs.map((pdf) => (
                                        <View key={pdf.id} style={styles.pdfItem}>
                                            <View style={styles.pdfInfo}>
                                                <Text style={styles.pdfTitle} numberOfLines={1}>
                                                    {pdf.title}
                                                </Text>
                                                <Text style={styles.pdfSize}>{formatFileSize(pdf.fileSize)}</Text>
                                            </View>

                                            {isDownloading(device.id, pdf.id) ? (
                                                <View style={styles.progressContainer}>
                                                    <View
                                                        style={[
                                                            styles.progressBar,
                                                            { width: `${getProgressPercent(device.id, pdf.id)}%` },
                                                        ]}
                                                    />
                                                    <Text style={styles.progressText}>
                                                        {getProgressPercent(device.id, pdf.id)}%
                                                    </Text>
                                                </View>
                                            ) : (
                                                <TouchableOpacity
                                                    style={styles.downloadButton}
                                                    onPress={() => onDownload(device, pdf)}
                                                    activeOpacity={0.7}
                                                >
                                                    <Text style={styles.downloadText}>⬇️ Download</Text>
                                                </TouchableOpacity>
                                            )}
                                        </View>
                                    ))}
                                </View>
                            )}
                        </View>
                    ))}
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    scanButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#3B82F6',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 10,
    },
    scanningButton: {
        backgroundColor: '#6B7280',
    },
    scanButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 48,
    },
    emptyIcon: {
        fontSize: 48,
        marginBottom: 16,
    },
    emptyText: {
        fontSize: 16,
        color: '#9CA3AF',
        marginBottom: 8,
    },
    emptyHint: {
        fontSize: 14,
        color: '#6B7280',
    },
    deviceList: {
        gap: 12,
    },
    deviceCard: {
        backgroundColor: '#1F2937',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#374151',
    },
    deviceHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    deviceName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
        marginBottom: 4,
    },
    signalStrength: {
        fontSize: 12,
        color: '#6B7280',
    },
    hubBadge: {
        backgroundColor: '#10B981',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    hubText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#FFFFFF',
        letterSpacing: 1,
    },
    pdfList: {
        gap: 8,
    },
    pdfItem: {
        backgroundColor: '#374151',
        borderRadius: 10,
        padding: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    pdfInfo: {
        flex: 1,
        marginRight: 12,
    },
    pdfTitle: {
        fontSize: 14,
        fontWeight: '500',
        color: '#D1D5DB',
        marginBottom: 2,
    },
    pdfSize: {
        fontSize: 12,
        color: '#6B7280',
    },
    downloadButton: {
        backgroundColor: '#3B82F6',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
    },
    downloadText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    progressContainer: {
        width: 80,
        height: 32,
        backgroundColor: '#4B5563',
        borderRadius: 8,
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
    },
    progressBar: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        backgroundColor: '#3B82F6',
    },
    progressText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#FFFFFF',
        zIndex: 1,
    },
});
