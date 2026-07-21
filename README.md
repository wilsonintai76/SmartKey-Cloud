
# SmartKey v3 — BLE Key Cabinet System

## System Overview
The **SmartKey Key Cabinet** is a PWA-controlled IoT key management system. An ESP32 Dev Board with a relay (solenoid lock) and microswitch detects key presence. The React PWA connects directly via Web Bluetooth (BLE), authenticates users with fingerprint/Face ID (WebAuthn), and logs all key events to local IndexedDB with automatic cloud sync to Cloudflare Workers (Hono + D1).

---

## Quick Start
1.  **Flash the ESP32** — Open `firmware/KeyCabinet/KeyCabinet.ino` in Arduino IDE and upload to your ESP32 Dev Board.
2.  **Start the PWA** — `npm install && npm run dev`
3.  **Connect** — Open the PWA on Chrome/Edge (Android or desktop), tap "Connect to Cabinet", pair with the "KeyCabinet" BLE device.
4.  **Login** — Use fingerprint/Face ID or a local 4-Digit User ID + PIN.

> **Hardware pins:** Relay → GPIO4, Microswitch → GPIO5, LED → GPIO2

---

## BLE-First Architecture
The system communicates directly with the ESP32 Dev Board via Bluetooth Low Energy (Web Bluetooth API). No WiFi, no MQTT, no external storage required.

### Why BLE?
For a workshop environment, Bluetooth Low Energy provides:
*   **Direct peer-to-peer** — No router, no internet, no cloud dependency for core operations.
*   **Low latency** — Unlock commands arrive in milliseconds.
*   **Offline-first** — All logs are buffered in IndexedDB and synced to Cloudflare D1 when online.

### Offline Sync Logic
1.  **Key events** (TAKEN/RETURNED) are detected by the ESP32 microswitch and pushed via BLE notification.
2.  **IndexedDB buffer** — The PWA stores all events locally with `synced: 0`.
3.  **Background sync** — When the browser regains connectivity, logs are POSTed to the Cloudflare Hono API and marked `synced: 1` in IndexedDB.
4.  The Cloudflare Worker stores them in D1 (SQLite-compatible) for permanent audit trail.

---

## Tech Stack
*   **Edge Hardware:** ESP32 Dev Board (WROOM-32) with BLE + relay + microswitch.
*   **Firmware:** Arduino (ESP32 BLE Arduino library) — see `firmware/KeyCabinet/`.
*   **Backend:** Cloudflare Workers (Hono) + D1 + KV.
*   **Auth:** WebAuthn (fingerprint/Face ID) + local PIN fallback.
*   **Frontend:** React 18, TypeScript, Tailwind CSS, Vite PWA.
*   **Offline Storage:** IndexedDB (Dexie.js).
*   **Architecture:** Local-first with cloud sync (BLE + REST).

---

## CBM Mathematical Model
Mechanical health is calculated using linear degradation:

$$Health \% = 100 - \left( \frac{\text{UsageCount}}{\text{Threshold}} \times 100 \right)$$

*   **Cabinet Actuator Limit:** 50,000 cycles (Door Solenoid thermal fatigue).
*   **Key Sensor Switch Limit:** 100,000 cycles (Microswitch mechanical spring fatigue per slot).
