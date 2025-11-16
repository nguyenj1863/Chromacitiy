// BLE Controller data handling utilities

import { IMUData } from "./types";
import { BluetoothRemoteGATTServer, BluetoothRemoteGATTCharacteristic } from "@/app/store/useStore";

// Parse IMU data from ESP32 JSON string
export function parseIMUData(data: string): IMUData | { fire: boolean; time_ms?: number } | null {
  try {
    const parsed = JSON.parse(data);
    
    if (parsed && parsed.fire === true) {
      return { fire: true, time_ms: parsed.time_ms };
    }

    // Validate the data structure
    if (
      typeof parsed.time_ms === "number" &&
      Array.isArray(parsed.accel_g) &&
      parsed.accel_g.length === 3 &&
      Array.isArray(parsed.angularv_rad_s) &&
      parsed.angularv_rad_s.length === 3
    ) {
      return {
        time_ms: parsed.time_ms,
        accel_g: [
          parsed.accel_g[0],
          parsed.accel_g[1],
          parsed.accel_g[2],
        ] as [number, number, number],
        angularv_rad_s: [
          parsed.angularv_rad_s[0],
          parsed.angularv_rad_s[1],
          parsed.angularv_rad_s[2],
        ] as [number, number, number],
      };
    }
    
    return null;
  } catch (error) {
    console.error("Error parsing IMU data:", error);
    return null;
  }
}

// Store the notification handler so we can remove it if needed
let currentNotificationHandler: ((event: any) => void) | null = null;
let currentCharacteristic: BluetoothRemoteGATTCharacteristic | null = null;

// Set up BLE notifications for IMU data
export async function setupIMUNotifications(
  server: BluetoothRemoteGATTServer,
  onData: (data: IMUData) => void,
  onFire?: (timestamp: number) => void
): Promise<BluetoothRemoteGATTCharacteristic | null> {
  try {
    const SERVICE_UUID = "12345678-1234-1234-1234-1234567890ab";
    const CHAR_TX_UUID = "12345678-1234-1234-1234-1234567890ac"; // Notify (ESP32 → Web)

    // Get the service
    const service = await server.getPrimaryService(SERVICE_UUID);
    
    // Get the TX characteristic (for receiving data)
    const characteristic = await service.getCharacteristic(CHAR_TX_UUID);
    
    // Verify characteristic supports notifications
    if (!characteristic.properties.notify) {
      throw new Error("Characteristic does not support notifications");
    }
    
    // Remove old listener if it exists
    if (currentCharacteristic && currentNotificationHandler) {
      try {
        currentCharacteristic.removeEventListener("characteristicvaluechanged", currentNotificationHandler);
      } catch (error) {
        // Ignore errors when removing listener (might not exist)
      }
    }
    
    // Set up notification listener
    const handleNotification = (event: any) => {
      const target = event.target as BluetoothRemoteGATTCharacteristic;
      if (target.value) {
        try {
          // Convert DataView to string
          const decoder = new TextDecoder();
          const dataString = decoder.decode(target.value);
          
          // Parse IMU data
          const imuOrFire = parseIMUData(dataString);
          if (imuOrFire) {
            if ("fire" in imuOrFire && imuOrFire.fire) {
              onFire?.(imuOrFire.time_ms ?? Date.now());
            } else {
              onData(imuOrFire as IMUData);
            }
          }
        } catch (error) {
          console.error("Error processing BLE notification:", error);
        }
      }
    };
    
    // Store handler and characteristic for cleanup
    currentNotificationHandler = handleNotification;
    currentCharacteristic = characteristic;
    
    // Add event listener BEFORE starting notifications
    characteristic.addEventListener("characteristicvaluechanged", handleNotification);
    
    // Ensure server is connected
    if (!server.connected) {
      await server.connect();
    }
    
    // Manually enable CCCD descriptor (Client Characteristic Configuration Descriptor)
    // This is sometimes needed even though startNotifications() should do it
    try {
      const CCCD_UUID = "00002902-0000-1000-8000-00805f9b34fb"; // Standard CCCD UUID
      const descriptor = await characteristic.getDescriptor(CCCD_UUID);
      if (descriptor) {
        // Write 0x0001 (little-endian) to enable notifications
        const enableNotifications = new Uint8Array([0x01, 0x00]);
        await descriptor.writeValue(enableNotifications);
      }
    } catch (descriptorError) {
      // Ignore - startNotifications() will handle it
    }
    
    // Start notifications - this should enable the CCCD descriptor
    try {
      await characteristic.startNotifications();
    } catch (notifyError) {
      console.error("Error starting notifications:", notifyError);
      throw notifyError;
    }
    
    return characteristic;
  } catch (error) {
    console.error("Error setting up IMU notifications:", error);
    return null;
  }
}

