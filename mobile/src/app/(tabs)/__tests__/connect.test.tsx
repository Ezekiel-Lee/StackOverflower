import {
  act,
  cleanup,
  fireEvent,
  render,
  waitFor,
} from "@testing-library/react-native";

import { Alert } from "react-native";

import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";

import Connect from "../connect";

// ==================================================

// Types

// ==================================================

type MockBackendDevice = {
  id: string;

  name: string;

  vendor: string;

  battery_level: number | null;
};

type RegistrationPayload = {
  name: string;
  vendor: string;
};

type MockBleDevice = {
  id: string;
  name: string;
  localName: string;
};

// ==================================================

// Mock functions and state

// ==================================================

const mockGetDevices = jest.fn<() => Promise<MockBackendDevice[]>>();

const mockRegisterDevice =
  jest.fn<(payload: RegistrationPayload) => Promise<MockBackendDevice>>();

const mockDeleteDevice = jest.fn<(deviceId: string) => Promise<void>>();

const mockEnsureHealthConnectPermissions = jest.fn<() => Promise<boolean>>();

const mockIsHealthConnectAvailable = jest.fn<() => Promise<boolean>>();

const mockGetHealthConnectSource = jest.fn<() => Promise<{ name: string }>>();

const mockSyncHealthDataToBackend =
  jest.fn<(deviceId: string, since: Date) => Promise<void>>();

const mockRequestBlePermissions = jest.fn<() => Promise<boolean>>();

const mockGetBleManager = jest.fn<() => { stopDeviceScan: () => void }>();

const mockScanForHeartRateDevices =
  jest.fn<(onDevice: (device: MockBleDevice) => void) => void>();

const mockConnectToDevice =
  jest.fn<
    (device: MockBleDevice, registeredDeviceId: string) => Promise<void>
  >();

const mockDisconnectBleDevice = jest.fn<() => Promise<void>>();

const mockSetConnectedDeviceId = jest.fn();

const mockSetConnectedDeviceType = jest.fn();

const mockClearConnectedDevice = jest.fn();

let mockConnectedDeviceId: string | null;

let mockConnectedDeviceType: string | null;

// ==================================================

// API mocks

// ==================================================

jest.mock("@/lib/api", () => ({
  getDevices: () => mockGetDevices(),

  registerDevice: (payload: RegistrationPayload) => mockRegisterDevice(payload),

  deleteDevice: (deviceId: string) => mockDeleteDevice(deviceId),
}));

// ==================================================

// Health Connect mocks

// ==================================================

jest.mock("@/lib/health/permissions", () => ({
  ensureHealthConnectPermissions: () => mockEnsureHealthConnectPermissions(),

  isHealthConnectAvailable: () => mockIsHealthConnectAvailable(),
}));

jest.mock("@/lib/health/deviceSource", () => ({
  getHealthConnectSource: (...args: unknown[]) =>
    mockGetHealthConnectSource(...args),
}));

jest.mock("@/lib/health/syncHealthData", () => ({
  syncHealthDataToBackend: (...args: unknown[]) =>
    mockSyncHealthDataToBackend(...args),
}));

// ==================================================

// Bluetooth mocks

// ==================================================

jest.mock("@/lib/ble/permissions", () => ({
  requestBlePermissions: () => mockRequestBlePermissions(),
}));

jest.mock("@/lib/ble/heartRateScanner", () => ({
  getBleManager: () => mockGetBleManager(),

  scanForHeartRateDevices: (onDevice: (device: MockBleDevice) => void) =>
    mockScanForHeartRateDevices(onDevice),
}));

jest.mock("@/lib/ble/useHeartRateDevice", () => ({
  useHeartRateDevice: () => ({
    connectToDevice: (device: MockBleDevice, registeredDeviceId: string) =>
      mockConnectToDevice(device, registeredDeviceId),

    disconnect: () => mockDisconnectBleDevice(),
  }),
}));

// ==================================================

// Device store mock

// ==================================================

jest.mock("@/store/deviceStore", () => ({
  useDeviceStore: (selector: (state: Record<string, unknown>) => unknown) =>
    selector({
      connectedDeviceId: mockConnectedDeviceId,

      connectedDeviceType: mockConnectedDeviceType,

      setConnectedDeviceId: mockSetConnectedDeviceId,

      setConnectedDeviceType: mockSetConnectedDeviceType,

      clearConnectedDevice: mockClearConnectedDevice,
    }),
}));

// ==================================================

// DeviceCard mock

// ==================================================

jest.mock("@/components/cards/deviceCard", () => {
  const React = require("react");

  const { View, Text, Pressable } = require("react-native");

  return function MockDeviceCard(props: {
    name: string;

    selected: boolean;

    removing: boolean;

    onSelect: () => void;

    onRemove: () => void;
  }) {
    return React.createElement(
      View,

      { testID: `device-card-${props.name}` },

      React.createElement(Text, null, props.name),

      React.createElement(
        Text,

        null,

        props.selected ? "Selected" : "Not selected",
      ),

      React.createElement(
        Pressable,

        {
          testID: `select-device-${props.name}`,

          accessibilityRole: "button",

          onPress: props.onSelect,
        },

        React.createElement(Text, null, "Select device"),
      ),

      React.createElement(
        Pressable,

        {
          testID: `remove-device-${props.name}`,

          accessibilityRole: "button",

          onPress: props.onRemove,
        },

        React.createElement(Text, null, "Remove device"),
      ),
    );
  };
});

// ==================================================

// MaterialIcons mock

// ==================================================

jest.mock("@expo/vector-icons/MaterialIcons", () => {
  const React = require("react");

  const { Text } = require("react-native");

  return function MockMaterialIcons(props: { name: string }) {
    return React.createElement(
      Text,

      { testID: `icon-${props.name}` },

      props.name,
    );
  };
});

// ==================================================

// Test data

// ==================================================

const savedDevices: MockBackendDevice[] = [
  {
    id: "device-1",

    name: "My Watch",

    vendor: "BLE",

    battery_level: 85,
  },

  {
    id: "device-2",

    name: "Health Connect",

    vendor: "health-connect",

    battery_level: null,
  },
];

const registeredDevice: MockBackendDevice = {
  id: "new-device-1",

  name: "New Wearable",

  vendor: "BLE",

  battery_level: null,
};

const mockBleDevice: MockBleDevice = {
  id: "ble-123",
  name: "Bluetooth Watch",
  localName: "Bluetooth Watch",
};

// ==================================================

// Tests

// ==================================================

describe("Connect screen", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockConnectedDeviceId = null;

    mockConnectedDeviceType = null;

    mockGetDevices.mockResolvedValue(savedDevices);

    mockRegisterDevice.mockResolvedValue(registeredDevice);

    mockDeleteDevice.mockResolvedValue(undefined);

    mockEnsureHealthConnectPermissions.mockResolvedValue(true);

    mockIsHealthConnectAvailable.mockResolvedValue(true);

    mockGetHealthConnectSource.mockResolvedValue({
      name: "Health Connect",
    });

    mockSyncHealthDataToBackend.mockResolvedValue(undefined);

    mockRequestBlePermissions.mockResolvedValue(true);

    mockGetBleManager.mockReturnValue({
      stopDeviceScan: jest.fn(),
    });

    mockScanForHeartRateDevices.mockImplementation(() => {});

    mockConnectToDevice.mockResolvedValue(undefined);

    mockDisconnectBleDevice.mockResolvedValue(undefined);
  });

  afterEach(() => {
    cleanup();
  });

  // ------------------------------------------------

  // Loading and saved devices

  // ------------------------------------------------

  it("shows a loading indicator while devices are being fetched", async () => {
    let resolveDevices!: (value: MockBackendDevice[]) => void;

    mockGetDevices.mockReturnValue(
      new Promise<MockBackendDevice[]>((resolve) => {
        resolveDevices = resolve;
      }),
    );

    const { getByText, queryByText, findByText } = await render(<Connect />);

    expect(getByText("Connect")).toBeTruthy();

    expect(queryByText("My Devices")).toBeNull();

    await act(async () => {
      resolveDevices(savedDevices);
    });

    expect(await findByText("My Devices")).toBeTruthy();

    expect(await findByText("My Watch")).toBeTruthy();
  });

  it("fetches and displays saved devices", async () => {
    const { findByText, getByTestId } = await render(<Connect />);

    expect(await findByText("My Devices")).toBeTruthy();

    expect(await findByText("My Watch")).toBeTruthy();

    expect(await findByText("Health Connect")).toBeTruthy();

    expect(getByTestId("device-card-My Watch")).toBeTruthy();

    expect(mockGetDevices).toHaveBeenCalledTimes(1);
  });

  it("shows the empty state when no devices exist", async () => {
    mockGetDevices.mockResolvedValue([]);

    const { findByText, findByTestId } = await render(<Connect />);

    expect(await findByText("No devices yet!")).toBeTruthy();

    expect(
      await findByText(
        "Connect a wearable to start monitoring your data in real time",
      ),
    ).toBeTruthy();

    expect(await findByTestId("icon-add")).toBeTruthy();
  });

  it("shows an error when fetching devices fails", async () => {
    mockGetDevices.mockRejectedValue(new Error("Network error"));

    const consoleSpy = jest

      .spyOn(console, "error")

      .mockImplementation(() => {});

    try {
      const { findByText } = await render(<Connect />);

      expect(
        await findByText("Couldn't load your devices. Please try again."),
      ).toBeTruthy();
    } finally {
      consoleSpy.mockRestore();
    }
  });

  // ------------------------------------------------

  // Device selection

  // ------------------------------------------------

  it("selects a saved device", async () => {
    const { findByTestId } = await render(<Connect />);

    await fireEvent.press(await findByTestId("select-device-My Watch"));

    expect(mockSetConnectedDeviceId).toHaveBeenCalledWith("device-1");
  });

  // ------------------------------------------------

  // Connection method modal

  // ------------------------------------------------

  it("opens the connection method modal from the empty state", async () => {
    mockGetDevices.mockResolvedValue([]);

    const { findByTestId, findByText } = await render(<Connect />);

    await fireEvent.press(await findByTestId("icon-add"));

    expect(
      await findByText("Choose how you want to connect your wearable."),
    ).toBeTruthy();

    expect(await findByText("Bluetooth (BLE)")).toBeTruthy();

    expect(await findByText("Health Connect")).toBeTruthy();
  });

  it("opens the connection method modal from the saved-device screen", async () => {
    const { findByText } = await render(<Connect />);

    await fireEvent.press(await findByText("Add Device"));

    expect(
      await findByText("Choose how you want to connect your wearable."),
    ).toBeTruthy();
  });

  it("closes the connection method modal when Cancel is pressed", async () => {
    mockGetDevices.mockResolvedValue([]);

    const { findByTestId, findByText, queryByText } = await render(<Connect />);

    await fireEvent.press(await findByTestId("icon-add"));

    expect(
      await findByText("Choose how you want to connect your wearable."),
    ).toBeTruthy();

    await fireEvent.press(await findByText("Cancel"));

    await waitFor(() => {
      expect(
        queryByText("Choose how you want to connect your wearable."),
      ).toBeNull();
    });
  });

  // ------------------------------------------------

  // Health Connect

  // ------------------------------------------------

  it("shows an error when Health Connect is unavailable", async () => {
    mockGetDevices.mockResolvedValue([]);

    mockIsHealthConnectAvailable.mockResolvedValue(false);

    const { findByTestId, findByText } = await render(<Connect />);

    await fireEvent.press(await findByTestId("icon-add"));

    await fireEvent.press(await findByText("Health Connect"));

    expect(
      await findByText(
        "Health Connect isn't available on this device. Install or update Health Connect, or choose Bluetooth instead.",
      ),
    ).toBeTruthy();

    expect(mockEnsureHealthConnectPermissions).not.toHaveBeenCalled();

    expect(mockRegisterDevice).not.toHaveBeenCalled();
  });

  it("shows an error when Health Connect permissions are denied", async () => {
    mockGetDevices.mockResolvedValue([]);

    mockEnsureHealthConnectPermissions.mockResolvedValue(false);

    const { findByTestId, findByText } = await render(<Connect />);

    await fireEvent.press(await findByTestId("icon-add"));

    await fireEvent.press(await findByText("Health Connect"));

    expect(
      await findByText(
        "Health Connect permissions were not granted. You can try again or choose Bluetooth instead.",
      ),
    ).toBeTruthy();

    expect(mockEnsureHealthConnectPermissions).toHaveBeenCalledTimes(1);

    expect(mockRegisterDevice).not.toHaveBeenCalled();
  });

  it("registers and syncs a Health Connect device successfully", async () => {
    mockGetDevices.mockResolvedValue([]);

    const { findByTestId, findByText } = await render(<Connect />);

    await fireEvent.press(await findByTestId("icon-add"));

    await fireEvent.press(await findByText("Health Connect"));

    await waitFor(() => {
      expect(mockRegisterDevice).toHaveBeenCalledWith({
        name: "Health Connect",

        vendor: "health-connect",
      });
    });

    expect(mockSyncHealthDataToBackend).toHaveBeenCalledWith(
      "new-device-1",

      expect.any(Date),
    );

    expect(mockSetConnectedDeviceId).toHaveBeenCalledWith("new-device-1");

    expect(mockSetConnectedDeviceType).toHaveBeenCalledWith("health-connect");
  });

  // ------------------------------------------------

  // Bluetooth

  // ------------------------------------------------

  it("shows an error when Bluetooth permissions are denied", async () => {
    mockGetDevices.mockResolvedValue([]);

    mockRequestBlePermissions.mockResolvedValue(false);

    const { findByTestId, findByText } = await render(<Connect />);

    await fireEvent.press(await findByTestId("icon-add"));

    await fireEvent.press(await findByText("Bluetooth (BLE)"));

    expect(
      await findByText(
        "Bluetooth permission is required to connect a wearable.",
      ),
    ).toBeTruthy();

    expect(mockScanForHeartRateDevices).not.toHaveBeenCalled();
  });

  it("starts scanning when Bluetooth permissions are granted", async () => {
    mockGetDevices.mockResolvedValue([]);

    const { findByTestId, findByText } = await render(<Connect />);

    await fireEvent.press(await findByTestId("icon-add"));

    await fireEvent.press(await findByText("Bluetooth (BLE)"));

    await waitFor(() => {
      expect(mockRequestBlePermissions).toHaveBeenCalledTimes(1);

      expect(mockScanForHeartRateDevices).toHaveBeenCalledTimes(1);
    });
  });

  it("displays Bluetooth devices discovered during scanning", async () => {
    mockGetDevices.mockResolvedValue([]);

    mockScanForHeartRateDevices.mockImplementation((onDevice) => {
      onDevice(mockBleDevice);
    });

    const { findByTestId, findByText } = await render(<Connect />);

    await fireEvent.press(await findByTestId("icon-add"));

    await fireEvent.press(await findByText("Bluetooth (BLE)"));

    expect(await findByText("Bluetooth Devices (1)")).toBeTruthy();

    expect(await findByText("Bluetooth Watch")).toBeTruthy();

    expect(await findByText("ble-123")).toBeTruthy();
  });

  it("does not add duplicate Bluetooth devices to the scan list", async () => {
    mockGetDevices.mockResolvedValue([]);

    mockScanForHeartRateDevices.mockImplementation((onDevice) => {
      onDevice(mockBleDevice);

      onDevice(mockBleDevice);
    });

    const { findByTestId, findByText } = await render(<Connect />);

    await fireEvent.press(await findByTestId("icon-add"));

    await fireEvent.press(await findByText("Bluetooth (BLE)"));

    expect(await findByText("Bluetooth Devices (1)")).toBeTruthy();
  });

  it("cancels Bluetooth scanning", async () => {
    mockGetDevices.mockResolvedValue([]);

    const { findByTestId, findByText, queryByText } = await render(<Connect />);

    await fireEvent.press(await findByTestId("icon-add"));

    await fireEvent.press(await findByText("Bluetooth (BLE)"));

    expect(await findByText("Searching for Bluetooth devices...")).toBeTruthy();

    await fireEvent.press(await findByText("Cancel Search"));

    await waitFor(() => {
      expect(queryByText("Searching for Bluetooth devices...")).toBeNull();
    });
  });

  // ------------------------------------------------

  // Device removal

  // ------------------------------------------------

  it("asks for confirmation before removing a device", async () => {
    const alertSpy = jest.spyOn(Alert, "alert");

    try {
      const { findByTestId } = await render(<Connect />);

      await fireEvent.press(await findByTestId("remove-device-My Watch"));

      expect(alertSpy).toHaveBeenCalledWith(
        "Remove Device",

        "Are you sure you want to remove My Watch?",

        expect.arrayContaining([
          expect.objectContaining({ text: "Cancel" }),

          expect.objectContaining({ text: "Remove" }),
        ]),
      );
    } finally {
      alertSpy.mockRestore();
    }
  });

  it("deletes a device after removal is confirmed", async () => {
    const alertSpy = jest.spyOn(Alert, "alert");

    try {
      const { findByTestId } = await render(<Connect />);

      await fireEvent.press(await findByTestId("remove-device-My Watch"));

      const alertButtons = alertSpy.mock.calls[0]?.[2] as
        | Array<{
            text?: string;

            onPress?: () => void;
          }>
        | undefined;

      const removeButton = alertButtons?.find(
        (button) => button.text === "Remove",
      );

      expect(removeButton?.onPress).toBeDefined();

      await act(async () => {
        removeButton?.onPress?.();
      });

      await waitFor(() => {
        expect(mockDeleteDevice).toHaveBeenCalledWith("device-1");
      });
    } finally {
      alertSpy.mockRestore();
    }
  });

  it("disconnects a connected BLE device before deleting it", async () => {
    mockConnectedDeviceId = "device-1";

    mockConnectedDeviceType = "ble";

    const alertSpy = jest.spyOn(Alert, "alert");

    try {
      const { findByTestId } = await render(<Connect />);

      await fireEvent.press(await findByTestId("remove-device-My Watch"));

      const alertButtons = alertSpy.mock.calls[0]?.[2] as
        | Array<{
            text?: string;

            onPress?: () => void;
          }>
        | undefined;

      const removeButton = alertButtons?.find(
        (button) => button.text === "Remove",
      );

      await act(async () => {
        removeButton?.onPress?.();
      });

      await waitFor(() => {
        expect(mockDisconnectBleDevice).toHaveBeenCalledTimes(1);

        expect(mockClearConnectedDevice).toHaveBeenCalledTimes(1);

        expect(mockDeleteDevice).toHaveBeenCalledWith("device-1");
      });
    } finally {
      alertSpy.mockRestore();
    }
  });
});
