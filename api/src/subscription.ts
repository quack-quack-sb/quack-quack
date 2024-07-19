import { makeServer, MessageType, stringifyMessage } from 'graphql-ws';
import { Context } from '.';
import { schema } from './schema';

// use cloudflare server websocket for graphql-ws
export function useWebsocket(
  socket: WebSocket,
  request: Request,
  protocol: string,
  context: Context,
) {
  // configure and make server
  const server = makeServer({
    schema,
    context,
    onError(ctx, message, errors) {
      console.error({ message, errors });
    },
  });

  // @ts-ignore
  socket.accept();

  // subprotocol pinger because WS level ping/pongs are not be available
  let pinger: NodeJS.Timer, pongWait: NodeJS.Timeout;

  function ping() {
    // for some reason socket.OPEN is undefined so checking against 1 directly
    if (socket.readyState === 1) {
      // send the subprotocol level ping message
      socket.send(stringifyMessage({ type: MessageType.Ping }));

      // wait for the pong for 6 seconds and then terminate
      pongWait = setTimeout(() => {
        clearInterval(pinger);
        socket.close();
      }, 6000);
    }
  }

  // ping the client on an interval every 12 seconds
  pinger = setInterval(() => ping(), 5000);

  // use the server
  const closed = server.opened(
    {
      protocol, // will be validated
      send: (data) => socket.send(data),
      close: (code, reason) => socket.close(code, reason),
      onMessage: (cb) =>
        socket.addEventListener('message', async (event) => {
          try {
            // wait for the the operation to complete
            // - if init message, waits for connect
            // - if query/mutation, waits for result
            // - if subscription, waits for complete
            await cb(event.data);
          } catch (err) {
            console.error(err);
            // all errors that could be thrown during the
            // execution of operations will be caught here
            socket.close(1011, (err as Error).message);
          }
        }),
      // pong received, clear termination timeout
      onPong: () => {
        clearTimeout(pongWait);
      },
    },
    // pass values to the `extra` field in the context
    { socket, request },
  );

  // notify server that the socket closed and stop the pinger
  // @ts-ignore
  socket.addEventListener('close', (code: number, reason: string) => {
    context.leaveRoom?.();
    clearTimeout(pongWait);
    clearInterval(pinger);
    closed(code, reason);
  });
}
