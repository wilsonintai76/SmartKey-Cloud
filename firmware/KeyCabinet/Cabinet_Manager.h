#ifndef CABINET_MANAGER_H
#define CABINET_MANAGER_H

#include "Config.h"

void initHardware() {
  pinMode(RELAY_PIN, OUTPUT);
  pinMode(MICRO_SWITCH, INPUT_PULLUP);  // LOW = key in place
  pinMode(LED_PIN, OUTPUT);
  
  digitalWrite(RELAY_PIN, LOW);
  digitalWrite(LED_PIN, LOW);

  // Read initial state
  keyPresent = (digitalRead(MICRO_SWITCH) == LOW);
}

void checkKeyStatus() {
  bool current = (digitalRead(MICRO_SWITCH) == LOW);
  
  if (current != keyPresent) {
    keyPresent = current;
    
    if (deviceConnected) {
      // Send 1 byte via BLE Notification
      uint8_t statusByte = keyPresent ? 0x01 : 0x00;
      pStatusCharacteristic->setValue(&statusByte, 1);
      pStatusCharacteristic->notify();
      
      Serial.print(">>> Key status updated: ");
      Serial.println(keyPresent ? "IN cabinet" : "TAKEN by user");
    } else {
      Serial.println(">>> Key status changed, but phone offline. Log locally.");
    }
  }
}

#endif
