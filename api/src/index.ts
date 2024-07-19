import { createYoga } from 'graphql-yoga';
import { schema } from './schema';
import { HonkRoom } from './durable-objects/HonkRoom';
import { Env } from './types';

export { HonkRoom };
export { Leaderboard } from './durable-objects/Leaderboard';
export { Sounds } from './durable-objects/Sounds';

export interface Context {
  env: Env;
  req: Request;
  isGoose: boolean;
  room: HonkRoom;
  leaveRoom?: () => void;
}

const yoga = createYoga<Context>({
  schema,
  graphqlEndpoint: '/graphql',
  graphiql: {
    subscriptionsProtocol: 'WS',
  },
  context: (ctx: Context): Context => {
    return {
      ...ctx,
      isGoose: ctx.req.headers.get('what-does-the-goose-say') === 'honk',
    };
  },
});

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext,
  ): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname.startsWith('/leaderboard')) {
      const name = url.searchParams.get('name') ?? 'global';
      const leaderboard = env.LEADERBOARDS.get(
        env.LEADERBOARDS.idFromName(name),
      );
      return await leaderboard.fetch(request.url, request);
    }

    // handles serving the actual sound file from R2
    // otherwise we'd need to do S3 style signed URLs
    if (url.pathname.startsWith('/sounds/')) {
      const parts = url.pathname.split('/');
      const soundName = parts[parts.length - 1];
      // TODO: verify that user has access to this sound using the prefix
      const prefix = parts[parts.length - 2];
      const fileName = `${prefix}/${soundName}`;

      if (!fileName) {
        return new Response('Sound not found', { status: 404 });
      }

      const object = await env.SOUNDS_BUCKET.get(fileName);
      if (!object) {
        return new Response('Sound not found', { status: 404 });
      }

      const headers = new Headers();
      object.writeHttpMetadata(headers);
      headers.set('etag', object.httpEtag);
      setCorsHeaders(headers);
      return new Response(object.body, { headers });
    }

    if (url.pathname === '/graphql' && !request.headers.get('Upgrade')) {
      return yoga.fetch(request, { env, req: request });
    }

    const roomId = url.searchParams.get('room') ?? 'singleroom';
    if (!roomId) {
      return new Response('Missing `room` search param', { status: 400 });
    }

    const honkRoom = env.ROOMS.get(env.ROOMS.idFromName(roomId));
    return await honkRoom.fetch(request.url, request);
  },
} satisfies ExportedHandler<Env>;

function setCorsHeaders(headers: Headers) {
  headers.set('Access-Control-Allow-Origin', '*');
  headers.set('Access-Control-Allow-Methods', 'GET,HEAD,POST,OPTIONS');
  headers.set('Access-Control-Max-Age', '86400');
}
