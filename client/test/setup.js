import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

afterEach(() => cleanup());

// jsdom ne fournit pas IntersectionObserver ; utilisé par le composant de scroll
// infini (InfiniteScrollSentinel). Un mock minimal suffit pour les tests qui ne
// vérifient pas directement le déclenchement d'intersection.
class IntersectionObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

global.IntersectionObserver = IntersectionObserverMock;
