import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";

export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      // gcTime par défaut (pas 0) : une valeur écrite via setQueryData sans observateur
      // actif (ex. cache mis à jour par une mutation seule, sans useQuery monté à côté)
      // serait sinon garbage-collectée quasi immédiatement (timer à 0ms), créant une
      // course avec les assertions qui suivent. Chaque test crée un client dédié, donc
      // l'isolation entre tests n'a de toute façon pas besoin d'un gcTime agressif.
      queries: { retry: false, staleTime: 0 },
      mutations: { retry: false },
    },
  });
}

export function wrapperWithClient(client = createTestQueryClient()) {
  return function Wrapper({ children }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

export function renderWithClient(ui, { client = createTestQueryClient() } = {}) {
  return { ...render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>), client };
}
