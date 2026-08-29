import { useState } from "react";
import { Link } from "react-router-dom";
import Loading from "../components/Loading";
import ErrorMessage from "../components/ErrorMessage";
import { useMyNotifications, useMarkNotificationRead, useMarkAllNotificationsRead } from "../hooks/useNotifications";

const CATEGORY_LABELS = {
  visite_technique: "Visites Techniques",
  decoration: "Décoration & Design",
  devis_finances: "Devis & Finances",
  compte_profil: "Compte & Profil",
};

// Regroupement par jour (US-COMM-02) : "Aujourd'hui" / "Hier" / date complète pour le
// reste — comparaison sur la date locale, pas un simple delta de 24h.
function dayLabel(dateStr) {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  const sameDay = (a, b) => a.toDateString() === b.toDateString();

  if (sameDay(date, today)) return "Aujourd'hui";
  if (sameDay(date, yesterday)) return "Hier";
  return date.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
}

function timeLabel(dateStr) {
  return new Date(dateStr).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

export default function Notifications() {
  const [category, setCategory] = useState("");
  const notificationsQuery = useMyNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const items = notificationsQuery.data?.items ?? [];
  const filtered = category ? items.filter((n) => n.category === category) : items;

  const groups = [];
  for (const notification of filtered) {
    const label = dayLabel(notification.createdAt);
    let group = groups.find((g) => g.label === label);
    if (!group) {
      group = { label, notifications: [] };
      groups.push(group);
    }
    group.notifications.push(notification);
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="font-serif text-xl font-semibold">
          Notifications
          {notificationsQuery.data?.unreadCount > 0 && (
            <span className="ml-2 rounded-full bg-ink px-2 py-0.5 text-xs font-medium text-white">
              {notificationsQuery.data.unreadCount}
            </span>
          )}
        </h1>
        {notificationsQuery.data?.unreadCount > 0 && (
          <button
            type="button"
            onClick={() => markAllRead.mutate()}
            disabled={markAllRead.isPending}
            className="text-xs font-medium text-ink underline"
          >
            Tout marquer comme lu
          </button>
        )}
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setCategory("")}
          className={`rounded-full px-3 py-1.5 text-xs font-medium ${
            category === "" ? "bg-ink text-white" : "bg-line/40 text-ink"
          }`}
        >
          Toutes
        </button>
        {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setCategory(value)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium ${
              category === value ? "bg-ink text-white" : "bg-line/40 text-ink"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {notificationsQuery.isLoading && <Loading />}
      {notificationsQuery.isError && <ErrorMessage error={notificationsQuery.error} />}

      {notificationsQuery.data && filtered.length === 0 && (
        <p className="text-center text-sm text-muted">Aucune notification.</p>
      )}

      <div className="space-y-6">
        {groups.map((group) => (
          <div key={group.label}>
            <h2 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">{group.label}</h2>
            <ul className="space-y-2">
              {group.notifications.map((notification) => (
                <li
                  key={notification.id}
                  className={`rounded-card border border-line bg-white p-4 shadow-card ${
                    notification.isRead ? "opacity-70" : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-medium text-muted">{CATEGORY_LABELS[notification.category]}</p>
                      <p className="mt-0.5 font-medium text-ink">{notification.title}</p>
                      {notification.body && <p className="mt-1 text-sm text-muted">{notification.body}</p>}
                    </div>
                    <div className="flex flex-none flex-col items-end gap-2">
                      <span className="text-xs text-muted">{timeLabel(notification.createdAt)}</span>
                      {!notification.isRead && <span className="h-2 w-2 rounded-full bg-ink" />}
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-4">
                    {notification.ctaUrl && (
                      <Link
                        to={notification.ctaUrl}
                        onClick={() => !notification.isRead && markRead.mutate(notification.id)}
                        className="text-xs font-medium text-ink underline"
                      >
                        {notification.ctaLabel || "Voir"}
                      </Link>
                    )}
                    {!notification.isRead && (
                      <button
                        type="button"
                        onClick={() => markRead.mutate(notification.id)}
                        className="text-xs font-medium text-muted underline"
                      >
                        Marquer comme lu
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
