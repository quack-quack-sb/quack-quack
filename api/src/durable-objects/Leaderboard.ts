import { Env } from '../types';

type InputEvent = {
  name: string;
};

type StoredLeaderboard = {
  [key: string]: {
    name: string;
    count: number;
  };
};

export class Leaderboard implements DurableObject {
  state: DurableObjectState;
  env: Env;

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.env = env;
  }

  async fetch(request: Request) {
    if (request.method === 'POST') {
      const body = (await request.json()) as Partial<InputEvent>;
      const { name } = body;

      if (typeof name !== 'string') {
        return new Response('Invalid input', { status: 400 });
      }

      const leaderboard = await this.state.storage.get<StoredLeaderboard>(
        'leaderboard',
      );

      if (!leaderboard) {
        await this.state.storage.put<StoredLeaderboard>('leaderboard', {
          [name]: {
            name,
            count: 1,
          },
        });
      } else {
        if (leaderboard[name]) {
          leaderboard[name].count += 1;
        } else {
          leaderboard[name] = {
            name,
            count: 1,
          };
        }
        await this.state.storage.put('leaderboard', leaderboard);
      }
      return new Response(formatLeaderboard(leaderboard ?? {}), {
        status: 201,
      });
    }

    if (request.method === 'GET') {
      let leaderboard =
        (await this.state.storage.get<StoredLeaderboard>('leaderboard')) ?? {};
      return new Response(formatLeaderboard(leaderboard), {
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    return new Response('Invalid request', { status: 400 });
  }
}

function formatLeaderboard(leaderboard: StoredLeaderboard) {
  const sortedReactions = Object.values(leaderboard).sort(
    (a, b) => b.count - a.count,
  );
  return JSON.stringify({ sortedReactions });
}
