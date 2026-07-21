#ifndef BLE_CALLBACKS_H
#define BLE_CALLBACKS_H

#include <BLEServer.h>
#include "Config.h"

// ======================================================
// 1. Server Callbacks (Connection / Disconnection)
// ======================================================
class MyServerCallbacks : public BLEServerCallbacks {
  void onConnect(BLEServer* pServer) override {
    deviceConnected = true;
    digitalWrite(LED_PIN, HIGH);
    Serial.println(">>> Phone CONNECTED");
  }

  void onDisconnect(BLEServer* pServer) override {
    deviceConnected = false;
    digitalWrite(LED_PIN, LOW);
    Serial.println(">>> Phone DISCONNECTED. Restarting advertising...");
    pServer->startAdvertising();
  }
};

// ======================================================
// 2. Write Characteristic Callbacks (Unlock Command)
// ======================================================
class WriteCallbacks : public BLECharacteristicCallbacks {
  void onWrite(BLECharacteristic *pCharacteristic) override {
    std::string value = pCharacteristic->getValue();
    if (value.length() > 0 && value[0] == '1') {
      Serial.println(">>> UNLOCK command received!");
      digitalWrite(RELAY_PIN, HIGH);
      delay(1500);              // Hold solenoid open for 1.5s
      digitalWrite(RELAY_PIN, LOW);
      Serial.println(">>> Lock closed.");
    }
  }
};

#endif
