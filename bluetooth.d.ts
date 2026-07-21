interface BluetoothDevice extends EventTarget {
    id: string;
    name?: string;
    gatt?: BluetoothRemoteGATTServer;
    watchAdvertisements(options?: WatchAdvertisementsOptions): Promise<void>;
    forget(): Promise<void>;
}

interface BluetoothRemoteGATTServer {
    device: BluetoothDevice;
    connected: boolean;
    connect(): Promise<BluetoothRemoteGATTServer>;
    disconnect(): void;
    getPrimaryService(service: BluetoothServiceUUID): Promise<BluetoothRemoteGATTService>;
}

interface BluetoothRemoteGATTService extends EventTarget {
    device: BluetoothDevice;
    uuid: BluetoothServiceUUID;
    isPrimary: boolean;
    getCharacteristic(characteristic: BluetoothCharacteristicUUID): Promise<BluetoothRemoteGATTCharacteristic>;
}

interface BluetoothRemoteGATTCharacteristic extends EventTarget {
    service: BluetoothRemoteGATTService;
    uuid: BluetoothCharacteristicUUID;
    properties: BluetoothCharacteristicProperties;
    value?: DataView;
    readValue(): Promise<DataView>;
    writeValue(value: BufferSource): Promise<void>;
    writeValueWithResponse(value: BufferSource): Promise<void>;
    writeValueWithoutResponse(value: BufferSource): Promise<void>;
    startNotifications(): Promise<BluetoothRemoteGATTCharacteristic>;
    stopNotifications(): Promise<BluetoothRemoteGATTCharacteristic>;
}

type BluetoothServiceUUID = number | string;
type BluetoothCharacteristicUUID = number | string;

interface BluetoothCharacteristicProperties {
    authenticatedSignedWrites: boolean;
    broadcast: boolean;
    indicate: boolean;
    notify: boolean;
    read: boolean;
    reliableWrite: boolean;
    writableAuxiliaries: boolean;
    write: boolean;
    writeWithoutResponse: boolean;
}

interface RequestDeviceOptions {
    filters?: BluetoothRequestDeviceFilter[];
    optionalServices?: BluetoothServiceUUID[];
    acceptAllDevices?: boolean;
}

interface BluetoothRequestDeviceFilter {
    services?: BluetoothServiceUUID[];
    name?: string;
    namePrefix?: string;
    manufacturerId?: number;
    serviceDataKey?: string;
}

interface Navigator {
    bluetooth: {
        requestDevice(options?: RequestDeviceOptions): Promise<BluetoothDevice>;
        getAvailability(): Promise<boolean>;
    };
}
