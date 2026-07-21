#ifndef BLE_MANAGER_H
#define BLE_MANAGER_H

#include <BLEDevice.h>
#include <BLEUtils.h>
#include <BLEServer.h>
#include "Config.h"
#include "BLE_Callbacks.h"

// ===== Global Definitions (must match Config.h) =====
BLEServer*          pServer = nullptr;
BLECharacteristic*  pStatusCharacteristic = nullptr;
bool                deviceConnected = false;
bool                keyPresent = true;

void initBLE() {
  // 1. Initialize Device
  BLEDevice::init("KeyCabinet");
  
  // 2. Create Server
  pServer = BLEDevice::createServer();
  pServer->setCallbacks(new MyServerCallbacks());

  // 3. Create Service
  BLEService *pService = pServer->createService(SERVICE_UUID);

  // 4. Write Characteristic (Phone -> ESP32)
  BLECharacteristic *pWriteChar = pService->createCharacteristic(
    WRITE_CHAR_UUID,
    BLECharacteristic::PROPERTY_WRITE
  );
  pWriteChar->setCallbacks(new WriteCallbacks());

  // 5. Notify Characteristic (ESP32 -> Phone)
  pStatusCharacteristic = pService->createCharacteristic(
    STATUS_CHAR_UUID,
    BLECharacteristic::PROPERTY_NOTIFY
  );

  // 6. Start Service
  pService->start();

  // 7. Start Advertising
  BLEAdvertising *pAdvertising = BLEDevice::getAdvertising();
  pAdvertising->addServiceUUID(SERVICE_UUID);
  pAdvertising->setScanResponse(true);
  pAdvertising->setMinPreferred(0x06);
  pAdvertising->setMaxPreferred(0x12);
  pServer->startAdvertising();

  Serial.println("BLE Initialized. Device name: 'KeyCabinet'");
}

#endif
