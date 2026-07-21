#ifndef CONFIG_H
#define CONFIG_H

#include <Arduino.h>

// ===== Hardware Pins =====
#define RELAY_PIN     4
#define MICRO_SWITCH  5
#define LED_PIN       2

// ===== BLE UUIDs =====
#define SERVICE_UUID        "4fafc201-1fb5-459e-8fcc-c5c9c331914b"
#define WRITE_CHAR_UUID     "beb5483e-36e1-4688-b7f5-ea07361b26a8"
#define STATUS_CHAR_UUID    "d3e5c4d6-8a9b-4e2c-9f1d-6a7b8c9d0e1f"

// ===== Global State =====
extern BLEServer*        pServer;
extern BLECharacteristic* pStatusCharacteristic;
extern bool              deviceConnected;
extern bool              keyPresent;

#endif
