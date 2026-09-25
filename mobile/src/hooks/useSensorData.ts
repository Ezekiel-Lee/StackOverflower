import { useEffect, useState } from "react";

import { getData } from "@/lib/api";
import type { SensorData } from "@/types/sensor";

export function useSensorData(deviceId: string | null) {
  const [sensorData, setSensorData] = useState<SensorData[]>([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSensorData() {
      if (!deviceId) {
        setSensorData([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const data = await getData(deviceId);

        setSensorData(data);
      } catch (error) {
        console.error("Failed to fetch sensor data:", error);

        setError("Unable to load sensor data.");
      } finally {
        setLoading(false);
      }
    }

    fetchSensorData();
  }, [deviceId]);

  return {
    sensorData,
    loading,
    error,
  };
}
