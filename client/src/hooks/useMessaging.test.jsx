import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { api } from "../lib/api";
import { wrapperWithClient } from "../../test/utils";
import { useMyConversations, useConversationMessages, useSendMessage, useSendAttachment } from "./useMessaging";

vi.mock("../lib/api", () => ({
  api: {
    myConversations: vi.fn(),
    conversationMessages: vi.fn(),
    sendMessage: vi.fn(),
    requestMessageAttachmentUploadUrl: vi.fn(),
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
  global.fetch = vi.fn();
});

describe("useMyConversations", () => {
  it("charge la liste des conversations de l'utilisateur courant", async () => {
    api.myConversations.mockResolvedValue({ items: [{ bookingId: "b1" }], page: 1, pageSize: 12, hasMore: false });
    const { result } = renderHook(() => useMyConversations(), { wrapper: wrapperWithClient() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(api.myConversations).toHaveBeenCalledWith({ page: 1, pageSize: 12 });
  });
});

describe("useConversationMessages", () => {
  it("charge les messages d'une réservation donnée", async () => {
    api.conversationMessages.mockResolvedValue({ conversationId: "c1", messages: [], booking: {} });
    const { result } = renderHook(() => useConversationMessages("booking-1"), { wrapper: wrapperWithClient() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(api.conversationMessages).toHaveBeenCalledWith("booking-1");
  });

  it("ne fetch rien tant qu'aucun bookingId n'est fourni", () => {
    renderHook(() => useConversationMessages(undefined), { wrapper: wrapperWithClient() });
    expect(api.conversationMessages).not.toHaveBeenCalled();
  });
});

describe("useSendMessage", () => {
  it("transmet le contenu du message à l'API", async () => {
    api.sendMessage.mockResolvedValue({ id: "m1" });
    const { result } = renderHook(() => useSendMessage("booking-1"), { wrapper: wrapperWithClient() });

    await act(async () => {
      await result.current.mutateAsync({ content: "Bonjour" });
    });

    expect(api.sendMessage).toHaveBeenCalledWith("booking-1", { content: "Bonjour" });
  });
});

describe("useSendAttachment", () => {
  it("enchaîne URL pré-signée, upload direct puis envoi du message avec la pièce jointe", async () => {
    api.requestMessageAttachmentUploadUrl.mockResolvedValue({ uploadUrl: "https://storage.test/upload", key: "messages/booking-1/x.pdf" });
    global.fetch.mockResolvedValue({ ok: true });
    api.sendMessage.mockResolvedValue({ id: "m1" });

    const file = new File(["data"], "devis.pdf", { type: "application/pdf" });
    const { result } = renderHook(() => useSendAttachment("booking-1"), { wrapper: wrapperWithClient() });

    await act(async () => {
      await result.current.mutateAsync(file);
    });

    expect(api.requestMessageAttachmentUploadUrl).toHaveBeenCalledWith("booking-1", "devis.pdf", "application/pdf");
    expect(api.sendMessage).toHaveBeenCalledWith("booking-1", { attachment_key: "messages/booking-1/x.pdf", attachment_file_name: "devis.pdf" });
  });

  it("échoue si le dépôt du fichier échoue, sans envoyer de message", async () => {
    api.requestMessageAttachmentUploadUrl.mockResolvedValue({ uploadUrl: "https://storage.test/upload", key: "x" });
    global.fetch.mockResolvedValue({ ok: false });

    const file = new File(["data"], "devis.pdf", { type: "application/pdf" });
    const { result } = renderHook(() => useSendAttachment("booking-1"), { wrapper: wrapperWithClient() });

    await expect(
      act(async () => {
        await result.current.mutateAsync(file);
      }),
    ).rejects.toThrow("Échec du dépôt de la pièce jointe");
    expect(api.sendMessage).not.toHaveBeenCalled();
  });
});
