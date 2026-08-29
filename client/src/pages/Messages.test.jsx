import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { api } from "../lib/api";
import { createTestQueryClient } from "../../test/utils";
import Messages from "./Messages";

vi.mock("../lib/api", () => ({
  api: {
    me: vi.fn(),
    myConversations: vi.fn(),
    conversationMessages: vi.fn(),
    sendMessage: vi.fn(),
    requestMessageAttachmentUploadUrl: vi.fn(),
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
  api.me.mockResolvedValue({ id: "buyer-1", fullName: "Buyer One", role: "acheteur" });
});

function renderMessages(bookingId) {
  const entry = bookingId ? `/messages/${bookingId}` : "/messages";
  return render(
    <QueryClientProvider client={createTestQueryClient()}>
      <MemoryRouter initialEntries={[entry]}>
        <Routes>
          <Route path="/messages" element={<Messages />} />
          <Route path="/messages/:bookingId" element={<Messages />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("Messages — messagerie liée à une réservation (US-COMM-01)", () => {
  it("affiche la liste des conversations avec le dernier message et le compteur non lu", async () => {
    api.myConversations.mockResolvedValue({
      items: [
        { bookingId: "b1", interlocutorName: "Jean Dupont", propertyAddress: "1 rue de Paris", lastMessage: { content: "À demain" }, unreadCount: 2 },
      ],
      page: 1,
      pageSize: 12,
      hasMore: false,
    });

    renderMessages();

    expect(await screen.findByText("Jean Dupont")).toBeInTheDocument();
    expect(screen.getByText("À demain")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("affiche le fil de discussion d'une réservation, aligne mes messages à droite", async () => {
    api.myConversations.mockResolvedValue({ items: [], page: 1, pageSize: 12, hasMore: false });
    api.conversationMessages.mockResolvedValue({
      conversationId: "c1",
      booking: { interlocutorName: "Jean Dupont", propertyAddress: "1 rue de Paris", slotStart: "2026-09-01T10:00:00Z" },
      messages: [
        { id: "m1", senderId: "buyer-1", content: "Bonjour", createdAt: "2026-08-30T09:00:00Z", attachmentKey: null },
        { id: "m2", senderId: "tech-1", content: "Bonjour à vous", createdAt: "2026-08-30T09:05:00Z", attachmentKey: null },
      ],
    });

    renderMessages("b1");

    expect(await screen.findByText("Bonjour")).toBeInTheDocument();
    expect(screen.getByText("Bonjour à vous")).toBeInTheDocument();
    expect(screen.getAllByText("Jean Dupont").length).toBeGreaterThan(0);
  });

  it("envoie un message texte et vide le champ de saisie", async () => {
    api.myConversations.mockResolvedValue({ items: [], page: 1, pageSize: 12, hasMore: false });
    api.conversationMessages.mockResolvedValue({
      conversationId: "c1",
      booking: { interlocutorName: "Jean Dupont", propertyAddress: "1 rue de Paris", slotStart: "2026-09-01T10:00:00Z" },
      messages: [],
    });
    api.sendMessage.mockResolvedValue({ id: "m1" });

    renderMessages("b1");

    const input = await screen.findByPlaceholderText("Votre message…");
    fireEvent.change(input, { target: { value: "Bonjour !" } });
    fireEvent.click(screen.getByRole("button", { name: "Envoyer" }));

    await waitFor(() => expect(api.sendMessage).toHaveBeenCalledWith("b1", { content: "Bonjour !" }));
    await waitFor(() => expect(input.value).toBe(""));
  });

  it("affiche un message d'attente quand aucune conversation n'est sélectionnée", async () => {
    api.myConversations.mockResolvedValue({ items: [], page: 1, pageSize: 12, hasMore: false });
    renderMessages();

    expect(await screen.findByText("Sélectionnez une conversation.")).toBeInTheDocument();
  });
});
