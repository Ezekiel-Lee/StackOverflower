import { act, fireEvent, render, waitFor } from "@testing-library/react-native";
import { Alert } from "react-native";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";

import Settings from "../settings";

type MockUser = {
  displayName?: string | null;
  email?: string | null;
} | null;

const mockPush = jest.fn();
const mockLogout = jest.fn<() => Promise<void>>();
let mockUser: MockUser = {
  displayName: "Alex Morgan",
  email: "alex@example.com",
};

jest.mock("expo-router", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

jest.mock("@/store/authStore", () => ({
  useAuthStore: (
    selector: (state: { user: MockUser; logout: typeof mockLogout }) => unknown,
  ) =>
    selector({
      user: mockUser,
      logout: mockLogout,
    }),
}));

jest.mock("@expo/vector-icons", () => {
  const ReactModule = require("react");
  const { Text: NativeText } = require("react-native");

  return {
    Ionicons: ({ name }: { name: string }) =>
      ReactModule.createElement(NativeText, { testID: `icon-${name}` }, name),
  };
});

jest.mock("@/components/cards/profileItem", () => {
  const ReactModule = require("react");
  const {
    Pressable: NativePressable,
    Text: NativeText,
    View: NativeView,
  } = require("react-native");

  return function MockProfileItem(props: {
    icon: string;
    title: string;
    subtitle: string;
    onPress: () => void;
  }) {
    return ReactModule.createElement(
      NativePressable,
      {
        testID: `profile-item-${props.title}`,
        accessibilityRole: "button",
        onPress: props.onPress,
      },
      ReactModule.createElement(
        NativeView,
        null,
        ReactModule.createElement(NativeText, null, props.title),
        ReactModule.createElement(NativeText, null, props.subtitle),
        ReactModule.createElement(
          NativeText,
          { testID: `profile-item-icon-${props.title}` },
          props.icon,
        ),
      ),
    );
  };
});

describe("Settings screen", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockUser = {
      displayName: "Alex Morgan",
      email: "alex@example.com",
    };

    mockLogout.mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("renders the profile header and description", async () => {
    const { findByText } = await render(<Settings />);

    expect(await findByText("Profile")).toBeTruthy();
    expect(
      await findByText("Manage your account and preferences"),
    ).toBeTruthy();
  });

  it("displays the signed-in user's name and email", async () => {
    const { findByText } = await render(<Settings />);

    expect(await findByText("Alex Morgan")).toBeTruthy();
    expect(await findByText("alex@example.com")).toBeTruthy();
  });

  it("shows the first character of the user's display name as the avatar", async () => {
    const { findByText } = await render(<Settings />);

    expect(await findByText("A")).toBeTruthy();
  });

  it("uses fallback name and email when user details are missing", async () => {
    mockUser = null;

    const { findByText } = await render(<Settings />);

    expect(await findByText("User")).toBeTruthy();
    expect(await findByText("No email")).toBeTruthy();
  });

  it("renders the Account and Support sections", async () => {
    const { findByText } = await render(<Settings />);

    expect(await findByText("Account")).toBeTruthy();
    expect(await findByText("Support")).toBeTruthy();

    expect(await findByText("Account Settings")).toBeTruthy();
    expect(await findByText("Update your account details")).toBeTruthy();
    expect(await findByText("Notifications")).toBeTruthy();
    expect(await findByText("Manage notification preferences")).toBeTruthy();
    expect(await findByText("Help & Support")).toBeTruthy();
    expect(await findByText("Get help with the app")).toBeTruthy();
  });

  it("navigates to Account Settings when selected", async () => {
    const { findByTestId } = await render(<Settings />);

    await fireEvent.press(await findByTestId("profile-item-Account Settings"));

    expect(mockPush).toHaveBeenCalledWith(
      "/(screens)/settings/accountSettings",
    );
  });

  it("navigates to Notifications when selected", async () => {
    const { findByTestId } = await render(<Settings />);

    await fireEvent.press(await findByTestId("profile-item-Notifications"));

    expect(mockPush).toHaveBeenCalledWith("/(screens)/notifications");
  });

  it("navigates to Help & Support when selected", async () => {
    const { findByTestId } = await render(<Settings />);

    await fireEvent.press(await findByTestId("profile-item-Help & Support"));

    expect(mockPush).toHaveBeenCalledWith("/support");
  });

  it("renders the Log Out button", async () => {
    const { findByText, findByTestId } = await render(<Settings />);

    expect(await findByText("Log Out")).toBeTruthy();
    expect(await findByTestId("icon-log-out-outline")).toBeTruthy();
  });

  it("calls logout when Log Out is pressed", async () => {
    const { findByText } = await render(<Settings />);

    await act(async () => {
      fireEvent.press(await findByText("Log Out"));
    });

    expect(mockLogout).toHaveBeenCalledTimes(1);
  });

  it("shows an alert when logout fails", async () => {
    const alertSpy = jest.spyOn(Alert, "alert");
    mockLogout.mockRejectedValue(new Error("Session expired"));

    const { findByText } = await render(<Settings />);

    await act(async () => {
      fireEvent.press(await findByText("Log Out"));
    });

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith("Failed", "Session expired");
    });
  });

  it("shows the fallback error message when logout fails without a message", async () => {
    const alertSpy = jest.spyOn(Alert, "alert");
    mockLogout.mockRejectedValue({});

    const { findByText } = await render(<Settings />);

    await act(async () => {
      fireEvent.press(await findByText("Log Out"));
    });

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith("Failed", "Failed to Logout");
    });
  });
});
