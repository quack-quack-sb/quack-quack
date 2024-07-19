import {
  Client,
  cacheExchange,
  fetchExchange,
  subscriptionExchange,
} from 'urql';
import { createClient as createWSClient } from 'graphql-ws';

const apiUrl = import.meta.env.VITE_API_URL;
const websocketUrl = import.meta.env.VITE_WEBSOCKET_URL;

const wsClient = createWSClient({
  url: `${websocketUrl}/graphql`,
  keepAlive: 10_000,
});

const subExchange = subscriptionExchange({
  forwardSubscription(request) {
    const input = { ...request, query: request.query || '' };
    return {
      subscribe(sink) {
        const unsubscribe = wsClient.subscribe(input, sink);
        return {
          unsubscribe,
        };
      },
    };
  },
});

export const client = new Client({
  url: `${apiUrl}/graphql`,
  exchanges: [cacheExchange, fetchExchange, subExchange],
});
