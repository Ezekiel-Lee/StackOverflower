import { readRecords } from "react-native-health-connect";

function timeRangeFilter(since: Date) {
  return {
    operator: "after" as const,
    startTime: since.toISOString(),
  };
}

export async function readHeartRate(since: Date) {
  const { records } = await readRecords("HeartRate", {
    timeRangeFilter: timeRangeFilter(since),
  });
  return records;
}

export async function readSteps(since: Date) {
  const { records } = await readRecords("Steps", {
    timeRangeFilter: timeRangeFilter(since),
  });
  return records;
}

export async function readSleep(since: Date) {
  const { records } = await readRecords("SleepSession", {
    timeRangeFilter: timeRangeFilter(since),
  });
  return records;
}
