import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { api } from "../lib/api";
import { createTestQueryClient } from "../../test/utils";
import Notifications from "./Notifications";

vi.mock("../lib/api", () => ({
  api: {
    notifications: vi.fn(),
    markNotificationRead: vi.fn(),
    markAllNotificationsRead: vi.fn(),
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
});

function renderNotifications() {
  return render(
    <QueryClientProvider client={createTestQueryClient()}>
      <MemoryRouter>
        <Notifications />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

const today = new Date().toISOString();

describe("Notifications — centre de notifications (US-COMM-02)", () => {
  it("regroupe les notifications par jour et affiche le compteur de non-lues", async () => {
    api.notifications.mockResolvedValue({
      items: [
        { id: "n1", category: "visite_technique", title: "Nouvelle réservation", body: null, ctaLabel: null, ctaUrl: null, isRead: false, createdAt: today },
        { id: "n2", category: "decoration", title: "Rapport disponible", body: null, ctaLabel: "Voir le rapport", ctaUrl: "/bookings/b1/report", isRead: true, createdAt: today },
      ],
      page: 1,
      pageSize: 12,
      hasMore: false,
      unreadCount: 1,
    });

    renderNotifications();

    expect(await screen.findByText("Aujourd'hui")).toBeInTheDocument();
    expect(screen.getByText("Nouvelle réservation")).toBeInTheDocument();
    expect(screen.getByText("Rapport disponible")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
  });

  it("filtre par catégorie", async () => {
    api.notifications.mockResolvedValue({
      items: [
        { id: "n1", category: "visite_technique", title: "Technique", body: null, ctaLabel: null, ctaUrl: null, isRead: false, createdAt: today },
        { id: "n2", category: "decoration", title: "Déco", body: null, ctaLabel: null, ctaUrl: null, isRead: false, createdAt: today },
      ],
      page: 1,
      pageSize: 12,
      hasMore: false,
      unreadCount: 2,
    });

    renderNotifications();

    await screen.findByText("Technique");
    fireEvent.click(screen.getByRole("button", { name: "Décoration & Design" }));

    expect(screen.queryByText("Technique")).not.toBeInTheDocument();
    expect(screen.getByText("Déco")).toBeInTheDocument();
  });

  it("marque une notification comme lue au clic sur son CTA", async () => {
    api.notifications.mockResolvedValue({
      items: [
        { id: "n1", category: "visite_technique", title: "Rapport disponible", body: null, ctaLabel: "Voir", ctaUrl: "/bookings/b1/report", isRead: false, createdAt: today },
      ],
      page: 1,
      pageSize: 12,
      hasMore: false,
      unreadCount: 1,
    });
    api.markNotificationRead.mockResolvedValue(undefined);

    renderNotifications();

    fireEvent.click(await screen.findByText("Voir"));

    await waitFor(() => expect(api.markNotificationRead).toHaveBeenCalledWith("n1"));
  });

  it("marque tout comme lu", async () => {
    api.notifications.mockResolvedValue({
      items: [{ id: "n1", category: "visite_technique", title: "Une notif", body: null, ctaLabel: null, ctaUrl: null, isRead: false, createdAt: today }],
      page: 1,
      pageSize: 12,
      hasMore: false,
      unreadCount: 1,
    });
    api.markAllNotificationsRead.mockResolvedValue(undefined);

    renderNotifications();

    fireEvent.click(await screen.findByText("Tout marquer comme lu"));

    await waitFor(() => expect(api.markAllNotificationsRead).toHaveBeenCalled());
  });

  it("affiche un message quand il n'y a aucune notification", async () => {
    api.notifications.mockResolvedValue({ items: [], page: 1, pageSize: 12, hasMore: false, unreadCount: 0 });

    renderNotifications();

    expect(await screen.findByText("Aucune notification.")).toBeInTheDocument();
  });
});
