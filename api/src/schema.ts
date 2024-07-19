import SchemaBuilder, { createContextCache } from '@pothos/core';
import AuthPlugin from '@pothos/plugin-scope-auth';
import { Account } from './durable-objects/HonkRoom';
import { Context } from './index';

const builder = new SchemaBuilder<{
  AuthScopes: {
    goose: true;
    duck: true;
  };
  Scalars: {
    ID: { Input: string; Output: string };
    File: { Input: File; Output: never };
  };
  Context: Context;
}>({
  plugins: [AuthPlugin],
  authScopes: (ctx) => ({
    goose: ctx.isGoose,
    duck: true,
  }),
  scopeAuthOptions: {
    unauthorizedError: () => {
      return new Error('No ducks allowed');
    },
  },
});

builder.scalarType('File', {
  serialize: () => {
    throw new Error('Uploads can only be used as input types');
  },
});

builder.queryType({
  fields: (t) => ({
    sounds: t.field({
      type: [Sound],
      resolve: async (root, args, ctx) => {
        const soundStorage = ctx.env.SOUNDS.get(
          ctx.env.SOUNDS.idFromName('global_storage'),
        );

        const sounds = await soundStorage.getSounds();

        const leaderboardRes = await ctx.env.LEADERBOARDS.get(
          ctx.env.LEADERBOARDS.idFromName('global'),
        ).fetch(ctx.req.url);

        const { sortedReactions } = await leaderboardRes.json<{
          sortedReactions: { name: string; count: number }[];
        }>();

        return sounds
          .map((sound) => {
            const index = sortedReactions.findIndex(
              (entry) => entry.name === sound.name,
            );

            return {
              name: sound.name,
              emoji: sound.emoji,
              description: sound.description,
              soundUrl: sound.soundUrl,
              count: index === -1 ? 0 : sortedReactions[index].count,
            };
          })
          .sort((a, b) => {
            return a.count < b.count ? 1 : a.count === b.count ? 0 : -1;
          });
      },
    }),
    room: t.field({
      type: Room,
      args: {
        name: t.arg.string({ required: true, defaultValue: 'singleroom' }),
      },
      resolve: async (root, args, ctx) => {
        const honkroom = ctx.env.ROOMS.get(ctx.env.ROOMS.idFromName(args.name));

        const url = new URL(ctx.req.url);

        url.pathname = '/who-there';

        const { accounts } = await honkroom
          .fetch(url.toString())
          .then((response) => response.json<{ accounts: Account[] }>());

        return {
          name: args.name,
          people: accounts,
        };
      },
    }),
  }),
});

builder.mutationType({
  fields: (t) => ({
    honk: t.boolean({
      args: {
        room: t.arg.string({ required: true, defaultValue: 'singleroom' }),
        name: t.arg.string({ required: true }),
        from: t.arg.string({ required: true }),
      },
      resolve: async (root, args, ctx) => {
        const honkRoom = ctx.env.ROOMS.get(ctx.env.ROOMS.idFromName(args.room));

        const url = new URL(ctx.req.url);

        url.pathname = '/honk';

        await honkRoom.fetch(url.toString(), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'sound',
            name: args.name,
            from: args.from,
          }),
        });

        return true;
      },
    }),

    addSound: t.field({
      type: Sound,
      args: {
        emoji: t.arg.string({ required: true }),
        name: t.arg.string({ required: true }),
        file: t.arg({
          type: 'File',
          required: true,
        }),
      },
      authScopes: {
        goose: true,
      },
      resolve: async (root, args, ctx) => {
        // TODO: do we want to consider non global storage and add team support?
        const soundStorage = ctx.env.SOUNDS.get(
          ctx.env.SOUNDS.idFromName('global_storage'),
        );

        const sound = await soundStorage.addSound(
          {
            name: args.name,
            emoji: args.emoji,
            description: '',
            file: args.file.stream(),
            fileName: args.file.name,
          },
          'global_storage',
        );

        return {
          name: sound.name,
          emoji: sound.emoji,
          soundUrl: sound.soundUrl,
          description: sound.description,
          count: 0,
        };
      },
    }),

    deleteSound: t.field({
      type: Sound,
      args: {
        soundName: t.arg.string({ required: true }),
      },
      authScopes: {
        goose: true,
      },
      resolve: async (root, args, ctx) => {
        const soundStorage = ctx.env.SOUNDS.get(
          ctx.env.SOUNDS.idFromName('global_storage'),
        );
        const sound = await soundStorage.deleteSound(args.soundName);

        return {
          name: sound.name,
          emoji: sound.emoji,
          soundUrl: sound.soundUrl,
          description: sound.description,
          count: 0,
        };
      },
    }),

    join: t.field({
      type: AccountRef,
      args: {
        name: t.arg.string({ required: true }),
        room: t.arg.string({ required: true, defaultValue: 'singleroom' }),
      },
      resolve: async (root, args, ctx) => {
        try {
          const honkRoom = ctx.env.ROOMS.get(
            ctx.env.ROOMS.idFromName(args.room),
          );

          const url = new URL(ctx.req.url);

          url.pathname = '/join';

          const response = await honkRoom.fetch(url.toString(), {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              name: args.name,
            }),
          });

          if (response.status > 300) {
            throw new Error(await response.text());
          }

          const body = await response.json<{
            account: { id: string; name: string };
          }>();

          return body.account;
        } catch (e) {
          console.error(e);
          // TODO: add errrors
          return { id: '', name: '' };
        }
      },
    }),
  }),
});

const Room = builder
  .objectRef<{
    name: string;
    people: Account[];
  }>('Room')
  .implement({
    fields: (t) => ({
      name: t.exposeString('name'),
      people: t.expose('people', {
        type: [AccountRef],
      }),
      sounds: t.field({
        type: [Sound],
        resolve: async (root, args, ctx) => {
          const soundStorage = ctx.env.SOUNDS.get(
            ctx.env.SOUNDS.idFromName('global_storage'),
          );
          const sounds = await soundStorage.getSounds();
          return sounds.map((sound) => ({
            name: sound.name,
            emoji: sound.emoji,
            description: sound.description,
            soundUrl: sound.soundUrl,
            count: 0,
          }));
        },
      }),
    }),
  });

const AccountRef = builder.objectRef<Account>('Account').implement({
  fields: (t) => ({
    name: t.exposeString('name'),
    id: t.exposeString('id'),
  }),
});

builder.subscriptionType({
  fields: (t) => ({
    room: t.field({
      type: HonkEvent,
      nullable: true,
      args: {
        accountName: t.arg.string({ required: true }),
        accountId: t.arg.string({ required: true }),
      },
      subscribe: async function* (root, args, ctx) {
        // hacky way to set a handler to close the connection.
        // this is called when the websocket connection is closed in subscription.ts
        ctx.leaveRoom = () => {
          ctx.room.leave(args.accountId);
        };

        const sub = ctx.room.subscribe({
          name: args.accountName,
          id: args.accountId,
        });

        for await (const event of sub) {
          if (
            event &&
            (event.type === 'sound' ||
              event.type === 'add' ||
              event.type === 'remove')
          ) {
            yield event;
          }
        }
      },
      resolve: (payload, args, ctx) => payload,
    }),
  }),
});

const SoundEvent = builder
  .objectRef<{
    type: 'sound';
    name: string;
    from: string;
  }>('SoundEvent')
  .implement({
    fields: (t) => ({
      type: t.exposeString('type'),
      from: t.exposeString('from'),
      sound: t.field({
        type: Sound,
        resolve: async (root, args, ctx) => {
          const soundStorage = ctx.env.SOUNDS.get(
            ctx.env.SOUNDS.idFromName('global_storage'),
          );
          const sound = (await soundStorage.getSound(root.name))!;
          return {
            name: sound.name,
            emoji: sound.emoji,
            soundUrl: sound.soundUrl,
            description: sound.description,
            count: 0,
          };
        },
      }),
    }),
  });

const AddEvent = builder
  .objectRef<{
    type: 'add';
    account: Account;
  }>('AddEvent')
  .implement({
    fields: (t) => ({
      type: t.exposeString('type'),
      name: t.string({
        resolve: (event) => event.account.name,
      }),
      id: t.string({
        resolve: (event) => event.account.id,
      }),
    }),
  });

const RemoveEvent = builder
  .objectRef<{
    type: 'remove';
    account: Account;
  }>('RemoveEvent')
  .implement({
    fields: (t) => ({
      type: t.exposeString('type'),
      name: t.string({
        resolve: (event) => event.account.name,
      }),
      id: t.string({
        resolve: (event) => event.account.id,
      }),
    }),
  });

const HonkEvent = builder.unionType('HonkEvent', {
  types: [SoundEvent, AddEvent, RemoveEvent],
  resolveType: (value) => {
    switch (value.type) {
      case 'sound':
        return SoundEvent;
      case 'add':
        return AddEvent;
      case 'remove':
        return RemoveEvent;
    }
  },
});

type SoundType = {
  emoji: string;
  name: string;
  soundUrl: string;
  description: string;
  count: number;
};

const Sound = builder.objectRef<SoundType>('Sound');

const SoundInput = builder
  .inputRef<Omit<SoundType, 'count'>>('SoundInput')
  .implement({
    fields: (t) => ({
      emoji: t.string({ required: true }),
      name: t.string({ required: true }),
      soundUrl: t.string({ required: true }),
      description: t.string({ required: true }),
    }),
  });

Sound.implement({
  fields: (t) => ({
    emoji: t.exposeString('emoji'),
    name: t.exposeString('name'),
    soundUrl: t.exposeString('soundUrl'),
    description: t.exposeString('description'),
  }),
});

export const schema = builder.toSchema({});
