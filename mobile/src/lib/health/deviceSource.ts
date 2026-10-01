import { readHeartRate, readSteps, readSleep } from "./readHealthData";

export type HealthConnectSource = {
  packageName: string;
  name: string;
};

export async function getHealthConnectSource(
  since: Date,
): Promise<HealthConnectSource | null> {
  const [heartRateRecords, stepsRecords, sleepRecords] = await Promise.all([
    readHeartRate(since),
    readSteps(since),
    readSleep(since),
  ]);

  const records = [...heartRateRecords, ...stepsRecords, ...sleepRecords];

  for (const record of records) {
    const packageName = record.metadata?.dataOrigin;

    if (packageName) {
      return {
        packageName,
        name: getSourceName(packageName),
      };
    }
  }

  return null;
}

function getSourceName(packageName: string): string {
  const knownSources: Record<string, string> = {
    "com.sec.android.app.shealth": "Samsung Health",

    "com.google.android.apps.fitness": "Google Fit",

    "com.fitbit.FitbitMobile": "Fitbit",
  };

  return knownSources[packageName] ?? packageName;
}
