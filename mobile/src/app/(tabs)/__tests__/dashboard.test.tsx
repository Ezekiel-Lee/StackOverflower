import { cleanup, fireEvent, render } from "@testing-library/react-native";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";

import Dashboard from "../index";

// ==================================================
// Mock state and actions
// ==================================================

const mockAddGraphSensor = jest.fn();
const mockChangeGraphSensor = jest.fn();
const mockRemoveGraphSensor = jest.fn();
const mockAddSummarySensor = jest.fn();
const mockRemoveSummarySensor = jest.fn();
const mockGetPickerSensors = jest.fn();

let mockUser: { displayName: string } | null;
let mockSelectedDevice: {
  id: string;
  supported_sensors: string[] | null;
} | null;
let mockConnectedDeviceId: string | null;
let mockDeviceLoading: boolean;
let mockSensorData: Record<string, unknown>;
let mockGraphSensors: string[];
let mockSummarySensors: string[];

// ==================================================
// Store and hook mocks
// ==================================================

jest.mock("@/store/authStore", () => ({
  useAuthStore: (selector: (state: { user: unknown }) => unknown) =>
    selector({ user: mockUser }),
}));

jest.mock("@/store/dashboardStore", () => ({
  useDashboardStore: (selector: (state: Record<string, unknown>) => unknown) =>
    selector({
      graphSensors: mockGraphSensors,
      summarySensors: mockSummarySensors,
      addGraphSensor: mockAddGraphSensor,
      changeGraphSensor: mockChangeGraphSensor,
      removeGraphSensor: mockRemoveGraphSensor,
      addSummarySensor: mockAddSummarySensor,
      removeSummarySensor: mockRemoveSummarySensor,
    }),
}));

jest.mock("@/hooks/useSelectedDevice", () => ({
  useSelectedDevice: () => ({
    selectedDevice: mockSelectedDevice,
    connectedDeviceId: mockConnectedDeviceId,
    loading: mockDeviceLoading,
  }),
}));

jest.mock("@/hooks/useSensorData", () => ({
  useSensorData: () => ({
    sensorData: mockSensorData,
  }),
}));

jest.mock("@/lib/sensorUtils", () => ({
  getPickerSensors: (...args: unknown[]) => mockGetPickerSensors(...args),
}));

// ==================================================
// Dashboard child component mocks
// ==================================================

jest.mock("@/components/dashboard/dashboardHeader", () => {
  const React = require("react");
  const { Text } = require("react-native");

  return function MockDashboardHeader(props: { displayName?: string }) {
    return React.createElement(
      Text,
      { testID: "dashboard-header" },
      props.displayName ?? "Dashboard",
    );
  };
});

jest.mock("@/components/dashboard/dashboardSection", () => {
  const React = require("react");
  const { Text } = require("react-native");

  return function MockDashboardSection(props: { title: string }) {
    return React.createElement(
      Text,
      { testID: `section-${props.title.toLowerCase()}` },
      props.title,
    );
  };
});

jest.mock("@/components/dashboard/emptyGraph", () => {
  const React = require("react");
  const { View, Text, Pressable } = require("react-native");

  return function MockEmptyGraph(props: { onAdd: () => void }) {
    return React.createElement(
      View,
      { testID: "empty-graph" },
      React.createElement(Text, null, "No graphs yet"),
      React.createElement(
        Pressable,
        {
          testID: "add-graph",
          accessibilityRole: "button",
          onPress: props.onAdd,
        },
        React.createElement(Text, null, "Add graph"),
      ),
    );
  };
});

jest.mock("@/components/dashboard/sensorGraph", () => {
  const React = require("react");
  const { View, Text, Pressable } = require("react-native");

  return function MockSensorGraph(props: {
    sensorType: string;
    onAdd: () => void;
    onChange: () => void;
    onRemove: () => void;
  }) {
    return React.createElement(
      View,
      { testID: `graph-${props.sensorType}` },
      React.createElement(Text, null, props.sensorType),
      React.createElement(
        Pressable,
        {
          testID: `change-graph-${props.sensorType}`,
          accessibilityRole: "button",
          onPress: props.onChange,
        },
        React.createElement(Text, null, "Change"),
      ),
      React.createElement(
        Pressable,
        {
          testID: `remove-graph-${props.sensorType}`,
          accessibilityRole: "button",
          onPress: props.onRemove,
        },
        React.createElement(Text, null, "Remove"),
      ),
      React.createElement(
        Pressable,
        {
          testID: "add-another-graph",
          accessibilityRole: "button",
          onPress: props.onAdd,
        },
        React.createElement(Text, null, "Add graph"),
      ),
    );
  };
});

// Filename casing matches the actual Dashboard import.
jest.mock("@/components/dashboard/highlightGrid", () => {
  const React = require("react");
  const { View, Text, Pressable } = require("react-native");

  return function MockHighlightsGrid(props: {
    sensorTypes: string[];
    onAdd: () => void;
    onRemove: (sensorType: string) => void;
  }) {
    return React.createElement(
      View,
      { testID: "highlights-grid" },
      ...props.sensorTypes.map((sensorType) =>
        React.createElement(
          View,
          { key: sensorType },
          React.createElement(Text, null, sensorType),
          React.createElement(
            Pressable,
            {
              testID: `remove-highlight-${sensorType}`,
              accessibilityRole: "button",
              onPress: () => props.onRemove(sensorType),
            },
            React.createElement(Text, null, "Remove highlight"),
          ),
        ),
      ),
      React.createElement(
        Pressable,
        {
          testID: "add-highlight",
          accessibilityRole: "button",
          onPress: props.onAdd,
        },
        React.createElement(Text, null, "Add highlight"),
      ),
    );
  };
});

// ==================================================
// AddSensorModal mock
// ==================================================

jest.mock("@/components/dashboard/addSensorModal", () => {
  const React = require("react");
  const { View, Text, Pressable } = require("react-native");

  return function MockAddSensorModal(props: {
    visible: boolean;
    mode: "graph" | "highlight" | null;
    graphAction: "add" | "change";
    sensors: string[];
    sensorData: unknown;
    selectedGraphs: string[];
    selectedHighlights: string[];
    editingGraph: string | null;
    onSelectGraph: (sensorType: string) => void;
    onSelectHighlight: (sensorType: string) => void;
    onClose: () => void;
  }) {
    if (!props.visible || props.mode === null) {
      return null;
    }

    return React.createElement(
      View,
      { testID: "sensor-picker-modal" },
      React.createElement(
        Text,
        null,
        props.mode === "graph"
          ? "Select graph sensor"
          : "Select highlight sensor",
      ),
      ...props.sensors.map((sensorType) =>
        React.createElement(
          Pressable,
          {
            key: sensorType,
            testID: `select-${sensorType}`,
            accessibilityRole: "button",
            onPress: () => {
              if (props.mode === "graph") {
                props.onSelectGraph(sensorType);
              } else {
                props.onSelectHighlight(sensorType);
              }
            },
          },
          React.createElement(Text, null, sensorType),
        ),
      ),
      React.createElement(
        Pressable,
        {
          testID: "close-modal",
          accessibilityRole: "button",
          onPress: props.onClose,
        },
        React.createElement(Text, null, "Close"),
      ),
    );
  };
});

// ==================================================
// SVG mock
// ==================================================

jest.mock("@/assets/icons/highlights.svg", () => ({
  __esModule: true,
  default: "HighlightsIcon",
}));

// ==================================================
// Test setup
// ==================================================

describe("Dashboard", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockUser = {
      displayName: "Iman Gurung",
    };

    mockSelectedDevice = {
      id: "device-123",
      supported_sensors: ["heartRate", "steps", "sleep"],
    };

    mockConnectedDeviceId = "device-123";
    mockDeviceLoading = false;

    mockSensorData = {
      heartRate: [],
      steps: [],
      sleep: [],
      stress: [],
    };

    mockGraphSensors = [];
    mockSummarySensors = [];

    mockGetPickerSensors.mockReturnValue(["heartRate", "steps", "sleep"]);
  });

  afterEach(() => {
    cleanup();
  });

  // ------------------------------------------------
  // Initial states
  // ------------------------------------------------

  it("renders the dashboard header", async () => {
    const { getByTestId } = await render(<Dashboard />);

    expect(getByTestId("dashboard-header")).toBeTruthy();
  });

  it("shows a loading indicator while the device is loading", async () => {
    mockDeviceLoading = true;

    const { getByTestId, queryByText } = await render(<Dashboard />);

    expect(getByTestId("dashboard-loading")).toBeTruthy();
    expect(queryByText("No device connected")).toBeNull();
  });

  it("shows a message when no device is connected", async () => {
    mockSelectedDevice = null;
    mockConnectedDeviceId = null;

    const { getByText } = await render(<Dashboard />);

    expect(getByText("No device connected")).toBeTruthy();
    expect(
      getByText("Connect a wearable to start receiving sensor data."),
    ).toBeTruthy();
  });

  it("shows the no-device state when the selected device is missing", async () => {
    mockSelectedDevice = null;

    const { getByText } = await render(<Dashboard />);

    expect(getByText("No device connected")).toBeTruthy();
  });

  // ------------------------------------------------
  // Graphs
  // ------------------------------------------------

  it("shows the empty graph state when no graphs are selected", async () => {
    const { getByTestId, getByText } = await render(<Dashboard />);

    expect(getByTestId("empty-graph")).toBeTruthy();
    expect(getByText("No graphs yet")).toBeTruthy();
  });

  it("opens the graph picker", async () => {
    const { getByTestId, findByTestId, findByText } = await render(
      <Dashboard />,
    );

    await fireEvent.press(getByTestId("add-graph"));

    expect(await findByTestId("sensor-picker-modal")).toBeTruthy();
    expect(await findByText("Select graph sensor")).toBeTruthy();
  });

  it("adds a graph when a sensor is selected", async () => {
    const { getByTestId, findByTestId } = await render(<Dashboard />);

    await fireEvent.press(getByTestId("add-graph"));

    expect(await findByTestId("select-heartRate")).toBeTruthy();

    await fireEvent.press(getByTestId("select-heartRate"));

    expect(mockAddGraphSensor).toHaveBeenCalledWith("heartRate");
  });

  it("opens the picker to change an existing graph", async () => {
    mockGraphSensors = ["heartRate"];

    const { getByTestId, findByText } = await render(<Dashboard />);

    await fireEvent.press(getByTestId("change-graph-heartRate"));

    expect(await findByText("Select graph sensor")).toBeTruthy();
  });

  it("changes an existing graph sensor", async () => {
    mockGraphSensors = ["heartRate"];

    const { getByTestId, findByTestId } = await render(<Dashboard />);

    await fireEvent.press(getByTestId("change-graph-heartRate"));

    expect(await findByTestId("select-steps")).toBeTruthy();

    await fireEvent.press(getByTestId("select-steps"));

    expect(mockChangeGraphSensor).toHaveBeenCalledWith("heartRate", "steps");
  });

  it("removes a graph", async () => {
    mockGraphSensors = ["heartRate"];

    const { getByTestId } = await render(<Dashboard />);

    await fireEvent.press(getByTestId("remove-graph-heartRate"));

    expect(mockRemoveGraphSensor).toHaveBeenCalledWith("heartRate");
  });

  it("does not show graphs when no device is selected", async () => {
    mockSelectedDevice = null;
    mockConnectedDeviceId = null;
    mockGraphSensors = ["heartRate"];

    const { queryByTestId } = await render(<Dashboard />);

    expect(queryByTestId("graph-heartRate")).toBeNull();
    expect(queryByTestId("empty-graph")).toBeNull();
  });

  it("filters stress from visible graphs", async () => {
    mockGraphSensors = ["heartRate", "stress"];

    const { getByTestId, queryByTestId } = await render(<Dashboard />);

    expect(getByTestId("graph-heartRate")).toBeTruthy();
    expect(queryByTestId("graph-stress")).toBeNull();
  });

  it("filters unsupported sensors from visible graphs", async () => {
    mockSelectedDevice = {
      id: "device-123",
      supported_sensors: ["heartRate"],
    };

    mockGraphSensors = ["heartRate", "steps"];

    const { getByTestId, queryByTestId } = await render(<Dashboard />);

    expect(getByTestId("graph-heartRate")).toBeTruthy();
    expect(queryByTestId("graph-steps")).toBeNull();
  });

  // ------------------------------------------------
  // Highlights
  // ------------------------------------------------

  it("renders the Highlights section", async () => {
    const { getByTestId } = await render(<Dashboard />);

    expect(getByTestId("section-highlights")).toBeTruthy();
    expect(getByTestId("highlights-grid")).toBeTruthy();
  });

  it("opens the highlight picker", async () => {
    const { getByTestId, findByText } = await render(<Dashboard />);

    await fireEvent.press(getByTestId("add-highlight"));

    expect(await findByText("Select highlight sensor")).toBeTruthy();
  });

  it("adds a highlight when a sensor is selected", async () => {
    const { getByTestId, findByTestId } = await render(<Dashboard />);

    await fireEvent.press(getByTestId("add-highlight"));

    expect(await findByTestId("select-steps")).toBeTruthy();

    await fireEvent.press(getByTestId("select-steps"));

    expect(mockAddSummarySensor).toHaveBeenCalledWith("steps");
  });

  it("removes a highlight", async () => {
    mockSummarySensors = ["steps"];

    const { getByTestId } = await render(<Dashboard />);

    await fireEvent.press(getByTestId("remove-highlight-steps"));

    expect(mockRemoveSummarySensor).toHaveBeenCalledWith("steps");
  });

  it("filters stress from visible highlights", async () => {
    mockSummarySensors = ["heartRate", "stress"];

    const { getByText, queryByText } = await render(<Dashboard />);

    expect(getByText("heartRate")).toBeTruthy();
    expect(queryByText("stress")).toBeNull();
  });

  it("filters unsupported sensors from visible highlights", async () => {
    mockSelectedDevice = {
      id: "device-123",
      supported_sensors: ["heartRate"],
    };

    mockSummarySensors = ["heartRate", "steps"];

    const { getByText, queryByText } = await render(<Dashboard />);

    expect(getByText("heartRate")).toBeTruthy();
    expect(queryByText("steps")).toBeNull();
  });

  // ------------------------------------------------
  // Sensor picker
  // ------------------------------------------------

  it("passes sensor data and supported sensors to getPickerSensors", async () => {
    await render(<Dashboard />);

    expect(mockGetPickerSensors).toHaveBeenCalledWith(mockSensorData, [
      "heartRate",
      "steps",
      "sleep",
    ]);
  });

  it("closes the picker when Close is pressed", async () => {
    const { getByTestId, findByTestId, queryByTestId } = await render(
      <Dashboard />,
    );

    await fireEvent.press(getByTestId("add-graph"));

    expect(await findByTestId("sensor-picker-modal")).toBeTruthy();

    await fireEvent.press(getByTestId("close-modal"));

    expect(queryByTestId("sensor-picker-modal")).toBeNull();
  });
});
