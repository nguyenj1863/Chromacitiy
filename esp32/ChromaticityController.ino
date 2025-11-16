#include <BLEDevice.h>
#include <BLEUtils.h>
#include <BLEServer.h>
#include <BLE2902.h>
#include <LiquidCrystal.h>
#include <Adafruit_MPU6050.h>
#include <Adafruit_Sensor.h>
#include <Wire.h>
#include <ArduinoJson.h>

// ==========================================
// CONFIGURATION & TUNING
// ==========================================
#define PLOT_MODE 0 

// -- Walking Sensitivity --
const float MAX_EXPECTED_ENERGY = 15.0;   

// -- Hysteresis --
const float MOVEMENT_THRESHOLD_ON = 1.2;
const float MOVEMENT_THRESHOLD_OFF = 0.6;

// -- Constants --
const float RAD_TO_DEG_CONST = 57.29578; 

// -- BLE UUIDs --
#define SERVICE_UUID "12345678-1234-1234-1234-1234567890ab"
#define CHAR_TX_UUID "12345678-1234-1234-1234-1234567890ac" 
#define CHAR_RX_UUID "12345678-1234-1234-1234-1234567890ad" 

// -- Pins --
#define LCD_RS 32
#define LCD_EN 33
#define LCD_D4 25
#define LCD_D5 26
#define LCD_D6 27
#define LCD_D7 14
#define MPU_INT 23
#define MPU_SDA 21
#define MPU_SCL 22
#define FIRE_BUTTON 5
#define REVERSE_BUTTON 18

// -- Timing --
const unsigned long IMU_INTERVAL = 50;
const unsigned long ANIM_INTERVAL = 600;
const unsigned long DEBOUNCE_MS = 100;

// ==========================================
// GLOBALS
// ==========================================
LiquidCrystal lcd(LCD_RS, LCD_EN, LCD_D4, LCD_D5, LCD_D6, LCD_D7);
Adafruit_MPU6050 mpu;
BLEServer* pServer = nullptr;
BLECharacteristic* txCharacteristic = nullptr;
SemaphoreHandle_t dataMutex; 

// -- Shared Data --
float shared_speed = 0.0;
float shared_aiming = 0.0; // Renamed for clarity
float shared_roll = 0.0;
float shared_yaw = 0.0;

// -- Timers --
unsigned long lastIMUSend = 0;
unsigned long lastAnimUpdate = 0;
unsigned long lastPlotTime = 0;

// -- Game State --
int ammoCount = 100;      // Updated: Starts at 100
int goldCount = 0;
float calorieCount = 0.0; // Updated: Float for decimals
bool inventoryUpdated = false;
bool deviceConnected = false;
bool justConnected = false;
bool justDisconnected = false;

// -- Buttons --
volatile bool buttonPressed = false;
volatile unsigned long lastButtonTime = 0;
volatile bool reverseStateChanged = false;
volatile unsigned long lastReverseChange = 0;

// -- LCD Icons --
byte ammoIcon[8] = { 0x04, 0x0E, 0x0E, 0x0E, 0x0E, 0x00, 0x0E, 0x00 };
byte goldIcon[2][8] = {
  {0b00000, 0b01110, 0b11111, 0b11011, 0b11011, 0b11111, 0b01110, 0b00000},
  {0b00000, 0b00100, 0b00100, 0b00100, 0b00100, 0b00100, 0b00100, 0b00000}
};
byte calorieFrame[3][8] = {
  {0x04, 0x02, 0x08, 0x06, 0x1A, 0x1F, 0x0E, 0x00},
  {0x04, 0x08, 0x04, 0x12, 0x0D, 0x1F, 0x0E, 0x00},
  {0x08, 0x04, 0x12, 0x08, 0x16, 0x1F, 0x0E, 0x00}
};

int calorieCharIndex = 3;
int goldCharIndex = 1;
bool blinkAmmo = false;
int blinkCount = 0;
bool ammoVisible = true;

// -- Calibration Offsets --
float gyroOffsetX = 0, gyroOffsetY = 0, gyroOffsetZ = 0;
float pitchOffset = 0.0;
float rollOffset = 0.0;

// ==========================================
// INTERRUPTS
// ==========================================
void IRAM_ATTR onButtonPress() {
  unsigned long now = millis();
  if (now - lastButtonTime > DEBOUNCE_MS) {
    buttonPressed = true;
    lastButtonTime = now;
  }
}

void IRAM_ATTR onReverseChange() {
  unsigned long now = millis();
  if (now - lastReverseChange > DEBOUNCE_MS) {
    reverseStateChanged = true;
    lastReverseChange = now;
  }
}

// ==========================================
// BLE
// ==========================================
class MyServerCallbacks : public BLEServerCallbacks {
  void onConnect(BLEServer* pServer) override {
    deviceConnected = true;
    justConnected = true;
  }
  void onDisconnect(BLEServer* pServer) override {
    deviceConnected = false;
    justDisconnected = true;
    BLEDevice::startAdvertising();
  }
};

class MyRxCallbacks : public BLECharacteristicCallbacks {
  void onWrite(BLECharacteristic* pCharacteristic) override {
    String rxValue = pCharacteristic->getValue();
    if (rxValue.length() == 0) return;

    StaticJsonDocument<200> doc;
    DeserializationError error = deserializeJson(doc, rxValue);

    if (!error) {
      if (doc.containsKey("ammo")) ammoCount = constrain(doc["ammo"], 0, 999);
      if (doc.containsKey("gold")) goldCount = constrain(doc["gold"], 0, 999);
      
      // Float Calories
      if (doc.containsKey("calorie")) calorieCount = (float)doc["calorie"];
      
      if (doc.containsKey("d_ammo")) ammoCount = constrain(ammoCount + (int)doc["d_ammo"], 0, 999);
      if (doc.containsKey("d_gold")) goldCount = constrain(goldCount + (int)doc["d_gold"], 0, 999);
      
      // Float Delta Calories
      if (doc.containsKey("d_calorie")) calorieCount += (float)doc["d_calorie"];

      if (calorieCount > 999.9) calorieCount = 999.9;
      if (calorieCount < 0) calorieCount = 0.0;

      inventoryUpdated = true;
    }
  }
};

// ==========================================
// HELPERS & UI
// ==========================================

void calibrateMPU() {
  lcd.clear(); 
  lcd.print("Don't Move!");
  lcd.setCursor(0, 1);
  lcd.print("Calibrating...");
  
  float gx = 0, gy = 0, gz = 0;
  float sumMag = 0; 
  float sumPitch = 0;
  float sumRoll = 0;
  const int samples = 500;

  for (int i = 0; i < samples; i++) {
    sensors_event_t a, g, temp;
    mpu.getEvent(&a, &g, &temp);
    gx += g.gyro.x; gy += g.gyro.y; gz += g.gyro.z;
    
    sumMag += sqrt(a.acceleration.x*a.acceleration.x + 
                   a.acceleration.y*a.acceleration.y + 
                   a.acceleration.z*a.acceleration.z);

    float ap = atan2(a.acceleration.y, a.acceleration.z) * RAD_TO_DEG_CONST;
    float ar = atan2(-a.acceleration.x, sqrt(a.acceleration.y*a.acceleration.y + a.acceleration.z*a.acceleration.z)) * RAD_TO_DEG_CONST;
    sumPitch += ap;
    sumRoll += ar;
    
    delay(2);
  }
  
  gyroOffsetX = gx / samples;
  gyroOffsetY = gy / samples;
  gyroOffsetZ = gz / samples;
  shared_speed = sumMag / samples; 

  pitchOffset = sumPitch / samples;
  rollOffset = sumRoll / samples;
  
  lcd.clear();
  lcd.print("Ready!");
  delay(500);
}

void drawCentered(String text, int centerCol) {
  int len = text.length();
  int x = centerCol - (len / 2);
  
  if (x < 0) x = 0;
  if (x > 15) x = 15;
  
  // Clear 5 spaces to handle decimal ghosting
  int clearX = max(0, centerCol - 2); 
  lcd.setCursor(clearX, 0);
  lcd.print("     "); 
  
  lcd.setCursor(x, 0);
  lcd.print(text);
}

void updateLCD() {
  drawCentered(String(ammoCount), 1);
  drawCentered(String(goldCount), 7);
  drawCentered(String(calorieCount, 1), 13); // 1 Decimal Place

  lcd.setCursor(1, 1); lcd.write(byte(0)); 
  lcd.setCursor(7, 1); lcd.write(byte(goldCharIndex)); 
  lcd.setCursor(13, 1); lcd.write(byte(calorieCharIndex)); 
}

void updateAnimation() {
  if (blinkAmmo) {
    ammoVisible = !ammoVisible;
    if (ammoVisible) {
      drawCentered(String(ammoCount), 1);
    } else {
      drawCentered("", 1); 
    }
    blinkCount++;
    if (blinkCount >= 6) {
      blinkAmmo = false;
      drawCentered(String(ammoCount), 1); 
    }
  }
  goldCharIndex = (goldCharIndex >= 2) ? 1 : goldCharIndex + 1;
  calorieCharIndex = (calorieCharIndex >= 5) ? 3 : calorieCharIndex + 1;
  
  lcd.setCursor(7, 1); lcd.write(byte(goldCharIndex));
  lcd.setCursor(13, 1); lcd.write(byte(calorieCharIndex));
}

// ==========================================
// SENSOR TASK (CORE 0)
// ==========================================
void SensorTask(void *parameter) {
  float local_gravity = (shared_speed > 5.0) ? shared_speed : 9.81;
  shared_speed = 0.0; 

  float local_energy = 0.0;
  float local_speed = 0.0;
  bool isMoving = false;
  
  // Updated Variable Names
  float aiming_angle_deg = 0.0;
  float roll_deg = 0.0;
  float yaw_deg = 0.0;
  const float dt = 0.01; 
  
  // Initialize to offset so we start at 0
  aiming_angle_deg = pitchOffset;
  roll_deg = rollOffset;
  
  const TickType_t xFrequency = pdMS_TO_TICKS(10); 
  TickType_t xLastWakeTime = xTaskGetTickCount();

  for(;;) {
    sensors_event_t a, g, temp;
    if(mpu.getEvent(&a, &g, &temp)) {
      
      // --- WALKING ---
      float rawMag = sqrt(a.acceleration.x*a.acceleration.x + 
                          a.acceleration.y*a.acceleration.y + 
                          a.acceleration.z*a.acceleration.z);

      local_gravity = (local_gravity * 0.995) + (rawMag * 0.005);
      float instantaneous_energy = abs(rawMag - local_gravity);

      if (instantaneous_energy > local_energy) 
        local_energy = (local_energy * 0.8) + (instantaneous_energy * 0.2);
      else 
        local_energy = (local_energy * 0.98) + (instantaneous_energy * 0.02);

      if (!isMoving && local_energy > MOVEMENT_THRESHOLD_ON) isMoving = true;
      else if (isMoving && local_energy < MOVEMENT_THRESHOLD_OFF) isMoving = false;

      float output_energy = isMoving ? local_energy : 0.0;
      float linear_s = constrain(output_energy / MAX_EXPECTED_ENERGY, 0.0, 1.0);
      float curved_s = linear_s * linear_s;
      
      local_speed = (local_speed * 0.9) + (curved_s * 0.1);
      if (local_speed < 0.01) local_speed = 0.0;

      // --- ORIENTATION ---
      float accel_pitch = atan2(a.acceleration.y, a.acceleration.z) * RAD_TO_DEG_CONST;
      float accel_roll = atan2(-a.acceleration.x, sqrt(a.acceleration.y*a.acceleration.y + a.acceleration.z*a.acceleration.z)) * RAD_TO_DEG_CONST;

      aiming_angle_deg += g.gyro.x * RAD_TO_DEG_CONST * dt; 
      roll_deg  += g.gyro.y * RAD_TO_DEG_CONST * dt; 
      yaw_deg   += g.gyro.z * RAD_TO_DEG_CONST * dt; 

      aiming_angle_deg = 0.98 * aiming_angle_deg + 0.02 * accel_pitch;
      roll_deg  = 0.98 * roll_deg  + 0.02 * accel_roll;

      // --- UPDATE SHARED (Subtract Offsets) ---
      if(xSemaphoreTake(dataMutex, (TickType_t)10) == pdTRUE) {
        shared_speed = local_speed;
        shared_aiming = aiming_angle_deg - pitchOffset;
        shared_roll = roll_deg - rollOffset;
        shared_yaw = yaw_deg;
        xSemaphoreGive(dataMutex);
      }
    }
    vTaskDelayUntil(&xLastWakeTime, xFrequency);
  }
}

// ==========================================
// COMMS & EVENTS
// ==========================================
void sendIMUData() {
  float s = 0, p = 0, r = 0, y = 0;
  if(xSemaphoreTake(dataMutex, (TickType_t)10) == pdTRUE) {
    s = shared_speed; 
    p = shared_aiming; 
    r = shared_roll; 
    y = shared_yaw;
    xSemaphoreGive(dataMutex);
  }

  char buffer[160];
  // Updated JSON keys to match your request
  snprintf(buffer, sizeof(buffer),
           "{\"time_ms\":%lu,\"walking_speed\":%.2f,\"aiming_angle_deg\":%.1f,\"roll_deg\":%.1f,\"yaw_deg\":%.1f}",
           millis(), s, p, r, y);
  txCharacteristic->setValue((uint8_t*)buffer, strlen(buffer));
  txCharacteristic->notify();
}

void sendButtonEvent() {
  char buffer[64];
  if (ammoCount > 0) {
    snprintf(buffer, sizeof(buffer), "{\"fire\":true,\"time_ms\":%lu}", millis());
    // NOTE: Decrement removed as per your code snippet (client logic)
    updateLCD();
  } else {
    snprintf(buffer, sizeof(buffer), "{\"fire\":false,\"time_ms\":%lu}", millis());
    blinkAmmo = true; blinkCount = 0; ammoVisible = true;
  }
  txCharacteristic->setValue((uint8_t*)buffer, strlen(buffer));
  txCharacteristic->notify();
}

void sendReverseEvent(bool pressed) {
  char buffer[64];
  snprintf(buffer, sizeof(buffer), "{\"reverse\":%s,\"time_ms\":%lu}", pressed ? "true" : "false", millis());
  txCharacteristic->setValue((uint8_t*)buffer, strlen(buffer));
  txCharacteristic->notify();
}

// ==========================================
// SETUP & LOOP
// ==========================================
void setup() {
  Serial.begin(115200);

  lcd.begin(16, 2);
  lcd.createChar(0, ammoIcon);
  lcd.createChar(1, goldIcon[0]);
  lcd.createChar(2, goldIcon[1]);
  lcd.createChar(3, calorieFrame[0]);
  lcd.createChar(4, calorieFrame[1]);
  lcd.createChar(5, calorieFrame[2]);
  lcd.clear();
  updateLCD();

  Wire.begin(MPU_SDA, MPU_SCL);
  if (!mpu.begin()) {
    lcd.clear(); lcd.print("MPU ERROR");
    while (1) delay(100);
  }
  
  mpu.setAccelerometerRange(MPU6050_RANGE_4_G);
  mpu.setGyroRange(MPU6050_RANGE_500_DEG);
  mpu.setFilterBandwidth(MPU6050_BAND_21_HZ);

  calibrateMPU(); 

  pinMode(FIRE_BUTTON, INPUT_PULLUP);
  attachInterrupt(digitalPinToInterrupt(FIRE_BUTTON), onButtonPress, FALLING);
  pinMode(REVERSE_BUTTON, INPUT_PULLUP);
  attachInterrupt(digitalPinToInterrupt(REVERSE_BUTTON), onReverseChange, CHANGE);

  dataMutex = xSemaphoreCreateMutex();

  xTaskCreatePinnedToCore(SensorTask, "SensorLoop", 4096, NULL, 1, NULL, 0);

#if !PLOT_MODE
  BLEDevice::init("Game Controller");
  pServer = BLEDevice::createServer();
  pServer->setCallbacks(new MyServerCallbacks());
  BLEService* pService = pServer->createService(SERVICE_UUID);

  txCharacteristic = pService->createCharacteristic(CHAR_TX_UUID, BLECharacteristic::PROPERTY_NOTIFY);
  txCharacteristic->addDescriptor(new BLE2902());

  BLECharacteristic* rxCharacteristic = pService->createCharacteristic(CHAR_RX_UUID, BLECharacteristic::PROPERTY_WRITE);
  rxCharacteristic->setCallbacks(new MyRxCallbacks());

  pService->start();
  BLEDevice::getAdvertising()->addServiceUUID(SERVICE_UUID);
  BLEDevice::startAdvertising();
#endif

  lcd.clear();
  lcd.print(PLOT_MODE ? "Plot Mode" : "Ready to pair");
}

void loop() {
#if PLOT_MODE
  if (millis() - lastPlotTime >= PLOT_INTERVAL) {
    float s, p, r, y; 
    if(xSemaphoreTake(dataMutex, 10) == pdTRUE) { 
        s = shared_speed; p = shared_aiming; r = shared_roll; y = shared_yaw;
        xSemaphoreGive(dataMutex); 
    }
    Serial.print("Speed:"); Serial.print(s);
    Serial.print(",Aim:"); Serial.print(p);
    Serial.print(",Roll:"); Serial.print(r);
    Serial.print(",Yaw:"); Serial.println(y);
    lastPlotTime = millis();
  }
#else
  if (justConnected) {
    justConnected = false;
    lcd.clear(); lcd.print("Connected!"); delay(500); lcd.clear(); updateLCD();
  }
  if (justDisconnected) {
    justDisconnected = false;
    inventoryUpdated = false; blinkAmmo = false;
    lcd.clear(); lcd.print("Disconnected"); lcd.setCursor(0, 1); lcd.print("Ready to pair");
  }

  if (inventoryUpdated) {
    updateLCD();
    inventoryUpdated = false;
  }

  if (deviceConnected) {
    if (buttonPressed) { sendButtonEvent(); buttonPressed = false; }
    if (reverseStateChanged) {
      reverseStateChanged = false;
      sendReverseEvent(digitalRead(REVERSE_BUTTON) == LOW);
    }

    if (millis() - lastIMUSend >= IMU_INTERVAL) {
      sendIMUData();
      lastIMUSend = millis();
    }

    if (millis() - lastAnimUpdate >= ANIM_INTERVAL) {
      updateAnimation();
      lastAnimUpdate = millis();
    }
  }
#endif
  delay(5); 
}