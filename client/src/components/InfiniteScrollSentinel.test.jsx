import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render } from "@testing-library/react";
import InfiniteScrollSentinel from "./InfiniteScrollSentinel";

let capturedCallback;
let observeSpy;
let disconnectSpy;

beforeEach(() => {
  observeSpy = vi.fn();
  disconnectSpy = vi.fn();
  // vi.fn() ne produit pas une fonction "constructible" (utilisable avec `new`) ;
  // une vraie classe est nécessaire pour simuler le constructeur IntersectionObserver.
  global.IntersectionObserver = class {
    constructor(callback) {
      capturedCallback = callback;
    }
    observe(...args) {
      observeSpy(...args);
    }
    unobserve() {}
    disconnect(...args) {
      disconnectSpy(...args);
    }
  };
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("InfiniteScrollSentinel", () => {
  it("observe le noeud sentinelle quand enabled est true", () => {
    render(<InfiniteScrollSentinel onIntersect={() => {}} enabled />);
    expect(observeSpy).toHaveBeenCalledTimes(1);
  });

  it("n'observe rien quand enabled est false", () => {
    render(<InfiniteScrollSentinel onIntersect={() => {}} enabled={false} />);
    expect(observeSpy).not.toHaveBeenCalled();
  });

  it("appelle onIntersect quand le noeud entre dans le viewport", () => {
    const onIntersect = vi.fn();
    render(<InfiniteScrollSentinel onIntersect={onIntersect} enabled />);

    capturedCallback([{ isIntersecting: true }]);

    expect(onIntersect).toHaveBeenCalledTimes(1);
  });

  it("n'appelle pas onIntersect si le noeud n'est pas intersectant", () => {
    const onIntersect = vi.fn();
    render(<InfiniteScrollSentinel onIntersect={onIntersect} enabled />);

    capturedCallback([{ isIntersecting: false }]);

    expect(onIntersect).not.toHaveBeenCalled();
  });

  it("déconnecte l'observer au démontage", () => {
    const { unmount } = render(<InfiniteScrollSentinel onIntersect={() => {}} enabled />);
    unmount();
    expect(disconnectSpy).toHaveBeenCalledTimes(1);
  });
});
