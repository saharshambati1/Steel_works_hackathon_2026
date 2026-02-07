/**
 * Bluetooth Service for PDF Sharing
 * 
 * NOTE: This is a MOCK implementation for Expo Go development.
 * For real BLE functionality, use expo-dev-client with react-native-ble-plx.
 * 
 * Hub Mode: Advertises PDFs for sharing
 * Receiver Mode: Scans for and downloads PDFs from hubs
 */

export interface BluetoothDevice {
    id: string;
    name: string;
    isHub: boolean;
    availablePDFs?: BluetoothPDF[];
    rssi?: number; // Signal strength
}

export interface BluetoothPDF {
    id: string;
    filename: string;
    title: string;
    fileSize: number;
}

export type TransferStatus = 'idle' | 'connecting' | 'transferring' | 'complete' | 'failed';

export interface TransferProgress {
    status: TransferStatus;
    progress: number; // 0-100
    speed?: number; // bytes per second
    error?: string;
}

type TransferCallback = (progress: TransferProgress) => void;

class BluetoothService {
    private isScanning: boolean = false;
    private isBroadcasting: boolean = false;
    private mockDevices: BluetoothDevice[] = [];
    private listeners: Set<(devices: BluetoothDevice[]) => void> = new Set();

    /**
     * Check if Bluetooth is available and enabled
     * In mock mode, always returns true
     */
    async isAvailable(): Promise<boolean> {
        // Mock: always available
        // Real: Check BLE state with react-native-ble-plx
        return true;
    }

    /**
     * Request Bluetooth permissions
     */
    async requestPermissions(): Promise<boolean> {
        // Mock: always granted
        // Real: Request BLUETOOTH_SCAN, BLUETOOTH_ADVERTISE, BLUETOOTH_CONNECT on Android 12+
        console.log('[Bluetooth] Permissions granted (mock)');
        return true;
    }

    /**
     * Start scanning for nearby devices (Receiver Mode)
     */
    async startScanning(onDeviceFound: (device: BluetoothDevice) => void): Promise<void> {
        if (this.isScanning) return;

        this.isScanning = true;
        console.log('[Bluetooth] Started scanning for devices...');

        // Mock: Simulate finding devices over time
        const mockHubs: BluetoothDevice[] = [
            {
                id: 'hub-001',
                name: "Teacher's Phone",
                isHub: true,
                rssi: -45,
                availablePDFs: [
                    { id: 'pdf-001', filename: 'Fractions_Grade4.pdf', title: 'Fractions for 4th Grade', fileSize: 125000 },
                    { id: 'pdf-002', filename: 'Forces_Grade8.pdf', title: 'Forces and Motion', fileSize: 180000 },
                ],
            },
            {
                id: 'hub-002',
                name: 'Classroom Tablet',
                isHub: true,
                rssi: -62,
                availablePDFs: [
                    { id: 'pdf-003', filename: 'Addition_Grade2.pdf', title: 'Basic Addition Practice', fileSize: 95000 },
                ],
            },
        ];

        // Simulate discovery delay
        let index = 0;
        const discoveryInterval = setInterval(() => {
            if (!this.isScanning || index >= mockHubs.length) {
                clearInterval(discoveryInterval);
                return;
            }

            const device = mockHubs[index];
            this.mockDevices.push(device);
            onDeviceFound(device);
            this.notifyListeners();
            index++;
        }, 1500);
    }

    /**
     * Stop scanning for devices
     */
    async stopScanning(): Promise<void> {
        this.isScanning = false;
        console.log('[Bluetooth] Stopped scanning');
    }

    /**
     * Start broadcasting as a hub (Hub Mode)
     */
    async startBroadcasting(pdfs: BluetoothPDF[]): Promise<void> {
        if (this.isBroadcasting) return;

        this.isBroadcasting = true;
        console.log('[Bluetooth] Started broadcasting with PDFs:', pdfs.map((p) => p.title));

        // Real: Start BLE peripheral mode with GATT service
        // Advertise service UUID with PDF metadata
    }

    /**
     * Stop broadcasting
     */
    async stopBroadcasting(): Promise<void> {
        this.isBroadcasting = false;
        console.log('[Bluetooth] Stopped broadcasting');
    }

    /**
     * Connect to a hub device
     */
    async connectToDevice(deviceId: string): Promise<boolean> {
        console.log(`[Bluetooth] Connecting to device ${deviceId}...`);

        // Mock: Simulate connection delay
        await new Promise((resolve) => setTimeout(resolve, 1000));

        console.log(`[Bluetooth] Connected to device ${deviceId}`);
        return true;
    }

    /**
     * Disconnect from a device
     */
    async disconnectFromDevice(deviceId: string): Promise<void> {
        console.log(`[Bluetooth] Disconnected from device ${deviceId}`);
    }

    /**
     * Download a PDF from a connected hub
     */
    async downloadPDF(
        deviceId: string,
        pdfId: string,
        onProgress: TransferCallback
    ): Promise<string> {
        console.log(`[Bluetooth] Downloading PDF ${pdfId} from ${deviceId}...`);

        onProgress({ status: 'connecting', progress: 0 });

        // Simulate connection
        await new Promise((resolve) => setTimeout(resolve, 500));

        onProgress({ status: 'transferring', progress: 0 });

        // Simulate transfer progress
        for (let progress = 0; progress <= 100; progress += 10) {
            await new Promise((resolve) => setTimeout(resolve, 200));
            onProgress({
                status: 'transferring',
                progress,
                speed: 50000, // 50 KB/s mock speed
            });
        }

        onProgress({ status: 'complete', progress: 100 });

        // Mock: Return fake base64 PDF content
        // Real: Return actual received PDF data
        return 'JVBERi0xLjQKJeLjz9MK...'; // Truncated mock PDF base64
    }

    /**
     * Send a PDF to a connected receiver (Hub Mode)
     */
    async sendPDF(
        deviceId: string,
        pdfBase64: string,
        onProgress: TransferCallback
    ): Promise<boolean> {
        console.log(`[Bluetooth] Sending PDF to ${deviceId}...`);

        onProgress({ status: 'connecting', progress: 0 });
        await new Promise((resolve) => setTimeout(resolve, 500));

        onProgress({ status: 'transferring', progress: 0 });

        // Simulate chunked transfer
        const totalChunks = 20;
        for (let i = 0; i <= totalChunks; i++) {
            await new Promise((resolve) => setTimeout(resolve, 150));
            onProgress({
                status: 'transferring',
                progress: Math.round((i / totalChunks) * 100),
                speed: 65000,
            });
        }

        onProgress({ status: 'complete', progress: 100 });
        return true;
    }

    /**
     * Get list of discovered devices
     */
    getDiscoveredDevices(): BluetoothDevice[] {
        return [...this.mockDevices];
    }

    /**
     * Subscribe to device discovery updates
     */
    subscribeToDevices(callback: (devices: BluetoothDevice[]) => void): () => void {
        this.listeners.add(callback);
        return () => this.listeners.delete(callback);
    }

    /**
     * Notify all listeners of device changes
     */
    private notifyListeners(): void {
        const devices = this.getDiscoveredDevices();
        this.listeners.forEach((callback) => callback(devices));
    }

    /**
     * Clear discovered devices
     */
    clearDevices(): void {
        this.mockDevices = [];
        this.notifyListeners();
    }

    /**
     * Check if currently scanning
     */
    getScanningState(): boolean {
        return this.isScanning;
    }

    /**
     * Check if currently broadcasting
     */
    getBroadcastingState(): boolean {
        return this.isBroadcasting;
    }
}

// Export singleton instance
export const bluetoothService = new BluetoothService();

// Export class for testing
export { BluetoothService };
