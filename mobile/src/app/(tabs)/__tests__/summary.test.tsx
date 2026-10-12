import {
  act,
  cleanup,
  fireEvent,
  render,
  waitFor,
} from "@testing-library/react-native";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";

import Summary from "../summary";

// Mock only RefreshControl. Mocking the entire react-native module can trigger
// native-only modules such as DevMenu in the Jest environment.
jest.mock(
  "react-native/Libraries/Components/RefreshControl/RefreshControl",
  () => {
    const React = require("react");

    function MockRefreshControl(props: {
      testID?: string;
      onRefresh?: () => void;
      refreshing?: boolean;
    }) {
      return React.createElement("RCTRefreshControl", {
        ...props,
        testID: props.testID ?? "summary-refresh-control",
        onPress: props.onRefresh,
      });
    }

    return {
      __esModule: true,
      default: MockRefreshControl,
    };
  },
);

// Keep these mocks intentionally lightweight so the tests focus on the screen's
// loading, empty, error, refresh, and reading-display behavior.

type MockDevice = {
  id: string;
  name: string;
  supported_sensors: string[];
};

type MockReading = {
  value: number;
  unit: string;
};

type MockSensorData = {
  sensor_type: string;
  value: number;
  unit: string;
  timestamp?: string;
};

type MockSensorStyle = {
  card: string;
  icon: string;
  iconColor: string;
  name: string;
};

const mockGetData = jest.fn<(deviceId: string) => Promise<MockSensorData[]>>();
const mockGetSensorStyle = jest.fn<(sensorType: string) => MockSensorStyle>();
const mockFormatSensorDisplay = jest.fn(
  (sensorType: string, value: number, unit: string) => `${value} ${unit}`,
);
const mockFormatSensorName = jest.fn((sensorType: string) => sensorType);
const mockGetLatestReading =
  jest.fn<(data: MockSensorData[], sensorType: string) => MockReading | null>();
const mockGetVisibleSensorTypes = jest.fn(
  (data: MockSensorData[], supportedSensors: string[]) => supportedSensors,
);

let mockSelectedDevice: MockDevice | null;
let mockConnectedDeviceId: string | null;
let mockDeviceLoading: boolean;

jest.mock("@/lib/api", () => ({
  getData: (deviceId: string) => mockGetData(deviceId),
}));

jest.mock("@/hooks/useSelectedDevice", () => ({
  useSelectedDevice: () => ({
    selectedDevice: mockSelectedDevice,
    connectedDeviceId: mockConnectedDeviceId,
    loading: mockDeviceLoading,
  }),
}));

jest.mock("@/lib/sensorStyles", () => ({
  getSensorStyle: (sensorType: string) => mockGetSensorStyle(sensorType),
}));

jest.mock("@/lib/sensorUtils", () => ({
  formatSensorDisplay: (sensorType: string, value: number, unit: string) =>
    mockFormatSensorDisplay(sensorType, value, unit),
  formatSensorName: (sensorType: string) => mockFormatSensorName(sensorType),
  getLatestReading: (data: MockSensorData[], sensorType: string) =>
    mockGetLatestReading(data, sensorType),
  getVisibleSensorTypes: (data: MockSensorData[], supportedSensors: string[]) =>
    mockGetVisibleSensorTypes(data, supportedSensors),
}));

jest.mock("@expo/vector-icons", () => {
  const React = require("react");
  const { Text } = require("react-native");
  return {
    Ionicons: (props: { name: string }) =>
      React.createElement(Text, { testID: `icon-${props.name}` }, props.name),
  };
});

const device: MockDevice = {
  id: "device-1",
  name: "My Watch",
  supported_sensors: ["heart_rate", "steps"],
};

const sensorData: MockSensorData[] = [
  { sensor_type: "heart_rate", value: 72, unit: "bpm" },
  { sensor_type: "steps", value: 4200, unit: "steps" },
];

const heartRateStyle: MockSensorStyle = {
  card: "bg-red-100",
  icon: "heart",
  iconColor: "#dc2626",
  name: "Heart Rate",
};

const stepsStyle: MockSensorStyle = {
  card: "bg-blue-100",
  icon: "footsteps",
  iconColor: "#2563eb",
  name: "Steps",
};

function configureConnectedDevice() {
  mockSelectedDevice = device;
  mockConnectedDeviceId = device.id;
  mockDeviceLoading = false;
}

describe("Summary screen", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockSelectedDevice = device;
    mockConnectedDeviceId = device.id;
    mockDeviceLoading = false;

    mockGetData.mockResolvedValue(sensorData);
    mockGetSensorStyle.mockImplementation((sensorType) =>
      sensorType === "heart_rate" ? heartRateStyle : stepsStyle,
    );
    mockGetLatestReading.mockImplementation((_data, sensorType) => {
      if (sensorType === "heart_rate") return { value: 72, unit: "bpm" };
      if (sensorType === "steps") return { value: 4200, unit: "steps" };
      return null;
    });
    mockGetVisibleSensorTypes.mockImplementation(
      (_data, supportedSensors) => supportedSensors,
    );
  });

  afterEach(() => {
    cleanup();
  });

  it("shows a loading indicator while the selected device is loading", async () => {
    mockDeviceLoading = true;

    const { getByText } = await render(<Summary />);

    expect(getByText("Loading sensor data...")).toBeTruthy();
  });

  it("shows a loading indicator while sensor data is being fetched", async () => {
    let resolveData!: (data: MockSensorData[]) => void;
    mockGetData.mockReturnValue(
      new Promise<MockSensorData[]>((resolve) => {
        resolveData = resolve;
      }),
    );

    const { getByText } = await render(<Summary />);
    expect(getByText("Loading sensor data...")).toBeTruthy();

    await act(async () => {
      resolveData(sensorData);
    });
  });

  it("shows the no-device state when no device is connected", async () => {
    mockSelectedDevice = null;
    mockConnectedDeviceId = null;

    const { getByText, getByTestId } = await render(<Summary />);

    expect(getByText("No device connected")).toBeTruthy();
    expect(
      getByText("Connect a wearable to view your sensor data."),
    ).toBeTruthy();
    expect(getByTestId("icon-watch-outline")).toBeTruthy();
    expect(mockGetData).not.toHaveBeenCalled();
  });

  it("fetches sensor data for the connected device", async () => {
    const { findByText } = await render(<Summary />);

    expect(await findByText("Summary")).toBeTruthy();
    expect(mockGetData).toHaveBeenCalledWith("device-1");
    expect(mockGetData).toHaveBeenCalledTimes(1);
  });

  it("renders the latest reading card for each visible sensor type", async () => {
    const { findByText } = await render(<Summary />);

    expect(await findByText("Heart Rate")).toBeTruthy();
    expect(await findByText("Steps")).toBeTruthy();
    expect(await findByText("72 bpm")).toBeTruthy();
    expect(await findByText("4200 steps")).toBeTruthy();
    expect(mockGetLatestReading).toHaveBeenCalledWith(sensorData, "heart_rate");
    expect(mockGetLatestReading).toHaveBeenCalledWith(sensorData, "steps");
  });

  it("shows the no-sensors state when the device supports no metrics", async () => {
    configureConnectedDevice();
    mockSelectedDevice = { ...device, supported_sensors: [] };
    mockGetVisibleSensorTypes.mockReturnValue([]);

    const { findByText, findByTestId } = await render(<Summary />);

    expect(await findByText("No sensors to show")).toBeTruthy();
    expect(
      await findByText("This device has no supported metrics."),
    ).toBeTruthy();
    expect(await findByTestId("icon-analytics-outline")).toBeTruthy();
  });

  it("shows the no-readings message when no visible sensor types have data", async () => {
    mockGetVisibleSensorTypes.mockReturnValue([]);

    const { findByText } = await render(<Summary />);

    expect(await findByText("No sensors to show")).toBeTruthy();
    expect(
      await findByText(
        "Sensor readings will appear here once your wearable starts syncing data.",
      ),
    ).toBeTruthy();
  });

  it("shows a fallback sensor name for an unknown sensor style", async () => {
    mockGetVisibleSensorTypes.mockReturnValue(["skin_temperature"]);
    mockGetSensorStyle.mockReturnValue({
      card: "bg-gray-100",
      icon: "help-circle",
      iconColor: "#6b7280",
      name: "Unknown Sensor",
    });
    mockGetLatestReading.mockReturnValue({ value: 31, unit: "°C" });

    const { findByText } = await render(<Summary />);

    expect(await findByText("skin_temperature")).toBeTruthy();
    expect(await findByText("31 °C")).toBeTruthy();
    expect(mockFormatSensorName).toHaveBeenCalledWith("skin_temperature");
  });

  it("shows a no-reading label when a sensor has no latest reading", async () => {
    mockGetVisibleSensorTypes.mockReturnValue(["heart_rate"]);
    mockGetLatestReading.mockReturnValue(null);

    const { findByText } = await render(<Summary />);

    expect(await findByText("Heart Rate")).toBeTruthy();
    expect(await findByText("No readings available")).toBeTruthy();
  });

  it("handles an API error and displays the empty sensor state", async () => {
    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
    mockGetData.mockRejectedValue(new Error("Network error"));
    mockGetVisibleSensorTypes.mockReturnValue([]);

    try {
      const { findByText } = await render(<Summary />);
      expect(await findByText("No sensors to show")).toBeTruthy();
      expect(consoleSpy).toHaveBeenCalledWith(
        "Failed to load sensor data:",
        expect.any(Error),
      );
    } finally {
      consoleSpy.mockRestore();
    }
  });

  it("refreshes sensor data when the user pulls to refresh", async () => {
    const { findByText, findByTestId } = await render(<Summary />);
    expect(await findByText("Heart Rate")).toBeTruthy();

    const refreshControl = await findByTestId("summary-refresh-control");
    await act(async () => {
      fireEvent.press(refreshControl);
    });

    await waitFor(() => {
      expect(mockGetData).toHaveBeenCalledTimes(2);
    });
  });
});
