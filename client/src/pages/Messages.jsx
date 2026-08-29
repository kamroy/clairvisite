import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import Button from "../components/Button";
import Loading from "../components/Loading";
import ErrorMessage from "../components/ErrorMessage";
import { initials, formatDateTime } from "../lib/format";
import { useMe } from "../hooks/useAuth";
import { useMyConversations, useConversationMessages, useSendMessage, useSendAttachment } from "../hooks/useMessaging";

function ConversationList({ bookingId }) {
  const conversationsQuery = useMyConversations();

  if (conversationsQuery.isLoading) return <Loading />;
  if (conversationsQuery.isError) return <ErrorMessage error={conversationsQuery.error} />;
  const conversations = conversationsQuery.data.items;

  return (
    <div className="flex flex-col divide-y divide-line rounded-card border border-line bg-white shadow-card">
      {conversations.map((c) => (
        <Link
          key={c.bookingId}
          to={`/messages/${c.bookingId}`}
          className={`flex items-center gap-3 p-3.5 ${c.bookingId === bookingId ? "bg-paper" : "hover:bg-paper"}`}
        >
          <span className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-line/40 text-xs font-semibold">
            {initials(c.interlocutorName)}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <span className="truncate text-sm font-semibold text-ink">{c.interlocutorName}</span>
              {c.unreadCount > 0 && (
                <span className="flex h-4.5 min-w-[18px] flex-none items-center justify-center rounded-full bg-ink px-1 text-[10px] font-semibold text-white">
                  {c.unreadCount}
                </span>
              )}
            </div>
            <p className="truncate text-xs text-muted">
              {c.lastMessage ? (c.lastMessage.content ?? `📎 ${c.lastMessage.attachmentFileName}`) : "Aucun message pour l'instant"}
            </p>
          </div>
        </Link>
      ))}
      {conversations.length === 0 && (
        <p className="p-4.5 text-center text-sm text-muted">
          Aucune conversation pour l'instant — elles apparaissent dès votre première réservation.
        </p>
      )}
    </div>
  );
}

function AttachmentCard({ fileName, downloadUrl }) {
  return (
    <a
      href={downloadUrl}
      target="_blank"
      rel="noreferrer"
      className="flex items-center gap-2 rounded-field border border-line bg-white px-3 py-2 text-xs font-medium text-ink hover:bg-paper"
    >
      📎 <span className="truncate">{fileName}</span>
    </a>
  );
}

function Thread({ bookingId, meId }) {
  const messagesQuery = useConversationMessages(bookingId);
  const sendMessage = useSendMessage(bookingId);
  const sendAttachment = useSendAttachment(bookingId);
  const [content, setContent] = useState("");

  if (messagesQuery.isLoading) return <Loading />;
  if (messagesQuery.isError) return <ErrorMessage error={messagesQuery.error} />;
  const { messages, booking } = messagesQuery.data;

  async function handleSend(e) {
    e.preventDefault();
    if (!content.trim()) return;
    await sendMessage.mutateAsync({ content });
    setContent("");
  }

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) sendAttachment.mutate(file);
  }

  return (
    <div className="flex h-full flex-col rounded-card border border-line bg-white shadow-card">
      <div className="flex items-center gap-3 border-b border-line p-3.5">
        <Link to="/messages" className="text-xs font-medium text-muted underline sm:hidden">
          ← Liste
        </Link>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-ink">{booking.interlocutorName}</p>
          <p className="truncate text-xs text-muted">
            📍 {booking.propertyAddress} · {formatDateTime(booking.slotStart)}
          </p>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2.5 overflow-y-auto p-3.5" style={{ minHeight: "320px", maxHeight: "480px" }}>
        {messages.map((m) => (
          <div key={m.id} className={`flex flex-col ${m.senderId === meId ? "items-end" : "items-start"}`}>
            {m.content && (
              <div
                className={`max-w-[75%] rounded-field px-3.5 py-2 text-sm ${
                  m.senderId === meId ? "bg-ink text-white" : "bg-paper text-ink"
                }`}
              >
                {m.content}
              </div>
            )}
            {m.attachmentKey && <AttachmentCard fileName={m.attachmentFileName} downloadUrl={m.attachmentDownloadUrl} />}
            <span className="mt-1 text-[10px] text-muted">{formatDateTime(m.createdAt)}</span>
          </div>
        ))}
        {messages.length === 0 && <p className="text-center text-sm text-muted">Aucun message pour l'instant.</p>}
      </div>

      <form onSubmit={handleSend} className="flex items-center gap-2 border-t border-line p-3">
        <label className="flex-none text-lg" title="Joindre un fichier">
          📎
          <input type="file" onChange={handleFileChange} disabled={sendAttachment.isPending} className="hidden" />
        </label>
        <input
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Votre message…"
          className="flex-1 rounded-field border border-line bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-ink/30 focus:border-ink"
        />
        <Button type="submit" disabled={sendMessage.isPending || !content.trim()} className="w-auto px-4">
          Envoyer
        </Button>
      </form>
      {(sendMessage.isError || sendAttachment.isError) && (
        <p className="px-3 pb-2 text-xs text-red-600">{(sendMessage.error || sendAttachment.error)?.message}</p>
      )}
    </div>
  );
}

export default function Messages() {
  const { bookingId } = useParams();
  const meQuery = useMe();

  if (meQuery.isLoading) return <Loading />;
  if (meQuery.isError) return <ErrorMessage error={meQuery.error} />;

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <h1 className="mb-4 font-serif text-xl font-semibold text-ink">Messages</h1>
      <div className="grid gap-4 sm:grid-cols-[280px_1fr] sm:items-start">
        <div className={bookingId ? "hidden sm:block" : "block"}>
          <ConversationList bookingId={bookingId} />
        </div>
        <div className={bookingId ? "block" : "hidden sm:block"}>
          {bookingId ? (
            <Thread bookingId={bookingId} meId={meQuery.data.id} />
          ) : (
            <div className="flex h-full min-h-[320px] items-center justify-center rounded-card border border-line bg-white text-sm text-muted shadow-card">
              Sélectionnez une conversation.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
