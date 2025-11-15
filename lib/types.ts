// IMU data type definition

export interface IMUData {
  time_ms: number;
  accel_g: [number, number, number]; // [x, y, z] acceleration in g-forces
  angularv_rad_s: [number, number, number]; // [x, y, z] angular velocity in rad/s
}

