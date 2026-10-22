import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AxiosError } from "axios";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import apiClient, { TOKEN_STORAGE_KEY } from "../api/client";
import ProtectedRoute from "../components/ProtectedRoute";
import Login from "../pages/Login";
import { AuthProvider } from "./AuthContext";

function renderApp(initialPath: string) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<p>Secret dashboard</p>} />
          </Route>
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  );
}

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("authentication flow", () => {
  it("sends signed-out visitors to the login page", async () => {
    renderApp("/");

    expect(await screen.findByRole("heading", { name: "Sign in" })).toBeInTheDocument();
    expect(screen.queryByText("Secret dashboard")).not.toBeInTheDocument();
  });

  it("signs in, stores the token and shows the protected page", async () => {
    const post = vi
      .spyOn(apiClient, "post")
      .mockResolvedValue({ data: { token: "abc123", username: "staff", is_staff: true } });

    renderApp("/");
    const user = userEvent.setup();

    await user.type(await screen.findByLabelText("Username"), "staff");
    await user.type(screen.getByLabelText("Password"), "secret-pass");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    expect(await screen.findByText("Secret dashboard")).toBeInTheDocument();
    expect(post).toHaveBeenCalledWith("/auth/login/", {
      username: "staff",
      password: "secret-pass",
    });
    expect(localStorage.getItem(TOKEN_STORAGE_KEY)).toBe("abc123");
  });

  it("shows a clear message for wrong credentials", async () => {
    const error = new AxiosError("Bad request");
    error.response = { status: 400, data: {}, statusText: "", headers: {}, config: {} as never };
    vi.spyOn(apiClient, "post").mockRejectedValue(error);

    renderApp("/login");
    const user = userEvent.setup();

    await user.type(await screen.findByLabelText("Username"), "staff");
    await user.type(screen.getByLabelText("Password"), "wrong");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Incorrect username or password."
    );
    expect(localStorage.getItem(TOKEN_STORAGE_KEY)).toBeNull();
  });

  it("restores a saved session on load", async () => {
    localStorage.setItem(TOKEN_STORAGE_KEY, "saved-token");
    vi.spyOn(apiClient, "get").mockResolvedValue({
      data: { username: "viewer", is_staff: false },
    });

    renderApp("/");

    expect(await screen.findByText("Secret dashboard")).toBeInTheDocument();
  });

  it("drops an invalid saved token and asks the user to sign in", async () => {
    localStorage.setItem(TOKEN_STORAGE_KEY, "expired-token");
    vi.spyOn(apiClient, "get").mockRejectedValue(new AxiosError("Unauthorized"));

    renderApp("/");

    await waitFor(() =>
      expect(screen.getByRole("heading", { name: "Sign in" })).toBeInTheDocument()
    );
    expect(localStorage.getItem(TOKEN_STORAGE_KEY)).toBeNull();
  });
});
