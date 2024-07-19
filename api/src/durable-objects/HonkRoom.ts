import {
  GRAPHQL_TRANSPORT_WS_PROTOCOL,
  handleProtocols,
  MessageType,
} from 'graphql-ws';
import { v4 as uuidv4 } from 'uuid';
import { useWebsocket } from '../subscription';
import { Env } from '../types';

export type HonkMessage =
  | {
      type: 'sound';
      name: string;
      from: string;
    }
  | {
      type: 'enter';
      name: string;
    }
  | {
      type: 'add';
      account: Account;
    }
  | {
      type: 'remove';
      account: Account;
    };

export interface HonkSession {
  socket?: WebSocket;
  createdAt: number;
  account: Account;
}

export type Account = {
  id: string;
  name: string;
};

function createAccount(name = '') {
  return {
    id: uuidv4(),
    name,
  };
}

export class HonkRoom implements DurableObject {
  honkeyDonkeySeshes: HonkSession[];
  subscribes: Map<
    string,
    { account: Account; iterator: EventIterator<HonkMessage> }
  > = new Map();
  env: Env;

  constructor(state: unknown, env: Env) {
    this.honkeyDonkeySeshes = [];
    this.env = env;
  }

  async fetch(request: Request) {
    const url = new URL(request.url);

    if (url.pathname === '/graphql') {
      return this.handleGraphQLSubscription(request);
    }

    if (url.pathname === '/honk') {
      return this.handleHonk(request);
    }

    if (url.pathname === '/who-there') {
      return this.whoThere(request);
    }

    if (url.pathname === '/join') {
      return this.join(request);
    }

    try {
      return this.onWsConnect(request);
    } catch (e) {
      console.error('ERROR', e);
      return new Response('Something went wrong.', { status: 400 });
    }
  }

  async handleHonk(request: Request) {
    const message = (await request.json()) as HonkMessage;

    this.trackLeaderboard(request, message);
    this.broadcast(message);

    return new Response('OK');
  }

  async whoThere(request: Request) {
    const accounts = this.honkeyDonkeySeshes.map((sesh) => sesh.account);

    return new Response(JSON.stringify({ accounts }));
  }

  async onWsConnect(request: Request): Promise<Response> {
    const upgradeHeader = request.headers.get('Upgrade');
    if (!upgradeHeader || upgradeHeader !== 'websocket') {
      return new Response('Expected Upgrade: websocket', { status: 426 });
    }

    const { [0]: client, [1]: socket } = new WebSocketPair();
    let ip = request.headers.get('CF-Connecting-IP');

    const account = createAccount();
    const createdAt = Date.now();
    const session: HonkSession = { socket, createdAt, account };

    const onClose = () => {
      socket.removeEventListener('close', onClose);
      socket.removeEventListener('error', onClose);
      this.honkeyDonkeySeshes = this.honkeyDonkeySeshes.filter(
        (member) => member !== session,
      );
      this.broadcast({
        type: 'remove',
        account,
      });
    };

    const onMessage = (msg: any) => {
      let data = { ...JSON.parse(msg.data), from: account.name } as HonkMessage;

      switch (data.type) {
        case 'enter': {
          const nameExist = !!this.honkeyDonkeySeshes.find(
            (sesh) => data.type === 'enter' && sesh.account.name === data.name,
          );
          if (nameExist || data.name.length < 3) {
            socket.send(
              JSON.stringify({
                type: 'error',
                code: 'INVALID_NAME',
              }),
            );
            return;
          }

          account.name = data.name;
          this.honkeyDonkeySeshes.push(session);

          let otherSeshes = this.honkeyDonkeySeshes.filter(
            (sesh) => sesh.account.name !== account.name,
          );

          this.broadcast(
            {
              type: 'add',
              account,
            },
            account.name,
          );

          socket.send(
            JSON.stringify({
              type: 'entered',
              accounts: otherSeshes.map((sesh) => sesh.account),
              selfAccount: account,
            }),
          );
          return;
        }

        case 'sound': {
          this.trackLeaderboard(request, data);
          this.broadcast(data);
          return;
        }

        default: {
          throw new Error('Invalid message');
        }
      }
    };

    // @ts-expect-error seems like the accept method is missing in types?
    socket.accept();
    socket.addEventListener('close', onClose);
    socket.addEventListener('error', onClose);
    socket.addEventListener('message', onMessage);

    return new Response(null, { status: 101, webSocket: client });
  }

  async join(request: Request) {
    const body = (await request.json()) as { name: string };

    const nameExist = !!this.honkeyDonkeySeshes.find(
      (sesh) => sesh.account.name === body.name,
    );
    if (nameExist || body.name.length < 3) {
      // TODO: return error
      return new Response(
        JSON.stringify({
          error: 'INVALID_NAME',
        }),
        {
          status: 400,
        },
      );
    }

    const account = createAccount(body.name);

    this.honkeyDonkeySeshes.push({
      createdAt: Date.now(),
      account,
    });

    this.broadcast(
      {
        type: 'add',
        account,
      },
      account.name,
    );

    return new Response(JSON.stringify({ account }));
  }

  broadcast(message: HonkMessage, from?: string) {
    // TODO: can we keep both kinds of subscribers in a single abstraction?
    // gql subscriptions subscribers
    this.subscribes.forEach(({ iterator }) => {
      iterator.push(message);
    });

    // websocket subscribers
    this.honkeyDonkeySeshes.forEach((sesh) => {
      if (from && from === sesh.account.name) {
        return;
      }
      sesh.socket?.send(JSON.stringify(message));
    });
  }

  async trackLeaderboard(request: Request, message: HonkMessage) {
    // TODO create and track specific room leaderboard
    if (message.type === 'sound') {
      const globalLeaderboard = this.env.LEADERBOARDS.get(
        this.env.LEADERBOARDS.idFromName('global'),
      );
      const url = new URL(request.url);
      url.pathname = '/leaderboard';
      await globalLeaderboard.fetch(
        new Request(url.toString(), {
          body: JSON.stringify({ name: message.name }),
          method: 'POST',
        }),
      );
    }
  }

  leave(accountId: string) {
    const subscriber = this.subscribes.get(accountId);
    const account = subscriber?.account;

    if (!account) {
      throw new Error('Invalid account id');
    }

    this.subscribes.delete(account.id);
    this.honkeyDonkeySeshes = this.honkeyDonkeySeshes.filter(
      (member) => member.account.name !== account.name,
    );

    this.broadcast({
      type: 'remove',
      account,
    });
  }

  subscribe(account: Account) {
    const subscriber = {
      account,
      iterator: new EventIterator<HonkMessage>(() => {
        this.leave(account.id);
      }),
    };

    this.subscribes.set(account.id, subscriber);

    return subscriber.iterator;
  }

  async handleGraphQLSubscription(request: Request) {
    const { [0]: client, [1]: server } = new WebSocketPair();
    const protocol = handleProtocols(
      request.headers.get('Sec-WebSocket-Protocol') ?? [],
    );

    useWebsocket(server, request, protocol || GRAPHQL_TRANSPORT_WS_PROTOCOL, {
      req: request,
      room: this,
      leaveRoom: () => {},
      env: this.env,
      isGoose: false,
    });

    server.addEventListener('message', (message) => {
      let data = JSON.parse(message.data) as { type?: MessageType.Ping };
      if (data.type === MessageType.Ping) {
        client.send(JSON.stringify({ type: MessageType.Pong }));
      }
    });

    return new Response(null, {
      status: 101,
      webSocket: client,
      headers: protocol
        ? {
            'Sec-WebSocket-Protocol': protocol,
          }
        : {},
    });
  }
}

export class EventIterator<T> {
  done: boolean = false;
  queue: T[] = [];
  nextPromise:
    | {
        resolve: (value: IteratorResult<T>) => void;
        reject: (error: unknown) => void;
      }
    | undefined;

  onReturn: () => void;

  constructor(onReturn: () => void) {
    this.onReturn = onReturn;
  }

  [Symbol.asyncIterator]() {
    return this;
  }

  next() {
    if (this.queue.length > 0) {
      return Promise.resolve({ done: false, value: this.queue.shift() });
    }

    return new Promise<IteratorResult<T>>((resolve, reject) => {
      this.nextPromise = { resolve, reject };
    });
  }

  return() {
    this.done = true;
    this.queue = [];
    this.onReturn();
    return Promise.resolve({ done: true, value: undefined });
  }

  push(value: T) {
    if (this.done) {
      return;
    }

    if (this.nextPromise) {
      this.nextPromise.resolve({ done: false, value });
      this.nextPromise = undefined;
    } else {
      this.queue.push(value);
    }
  }
}
