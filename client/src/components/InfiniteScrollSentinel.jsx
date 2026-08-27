import { useEffect, useRef } from "react";

// Div invisible observée via IntersectionObserver : dès qu'elle entre dans le
// viewport (l'utilisateur a scrollé jusqu'en bas de la liste), déclenche onIntersect.
export default function InfiniteScrollSentinel({ onIntersect, enabled }) {
  const ref = useRef(null);
  const onIntersectRef = useRef(onIntersect);
  onIntersectRef.current = onIntersect;

  useEffect(() => {
    const node = ref.current;
    if (!enabled || !node) return;

    const observer = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting) onIntersectRef.current();
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, [enabled]);

  return <div ref={ref} aria-hidden="true" data-testid="infinite-scroll-sentinel" className="h-1" />;
}
