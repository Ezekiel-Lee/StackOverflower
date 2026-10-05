export type Device = {
  id: string;
  owner_id: string;
  name: string;
  model: string | null;
  ble_identifier: string | null;
  firmware_version: string | null;
  created_at: string;
  vendor: string | null;
  vendor_device_id: string | null;
  battery_level: number | null;
  last_synced_at: string | null;
  supported_sensors: string[] | null;
};
