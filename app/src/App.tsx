import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useQuery, useSubscription, useClient } from 'urql';
import { AuthScreen, useAuth, Account } from './AuthScreen';
import { playSound } from './lib/sound';
import { volume } from './VolumeControl';
import { Sound } from './types';
import { SoundBoard } from '@/components/SoundBoard/SoundBoard';
import { Toaster } from '@/components/Notifications/Toaster';
import * as styles from './App.css';
import { AddSoundForm } from './components/AddSoundForm/AddSoundForm';
import { graphql, ResultOf } from './lib/graphql';

type AppProps = {
  sounds: Sound[];
};

/** Returns an integer between 20 and 60 */
const randomPosition = () => Math.round(Math.random() * 40) + 20;

const GetUsersInRoom = graphql(`
  query GetUsersInRoom($room: String!) {
    room(name: $room) {
      people {
        name
        id
      }
    }
  }
`);

const RoomSubscription = graphql(`
  subscription RoomSubscription($accountName: String!, $accountId: String!) {
    room(accountName: $accountName, accountId: $accountId) {
      __typename
      ... on AddEvent {
        name
        id
      }
      ... on RemoveEvent {
        name
        id
      }
      ... on SoundEvent {
        from
        sound {
          emoji
          name
          soundUrl
        }
      }
    }
  }
`);

type RoomEvent = ResultOf<typeof RoomSubscription>;

function useMap<T extends Record<string, any>>(keyField: keyof T) {
  const [, forceRender] = useState({});
  const [map] = useState(() => new Map<string, T>());

  const add = useCallback(
    (value: T | T[]) => {
      let added = false;
      if (Array.isArray(value)) {
        for (const v of value) {
          if (!map.has(v[keyField])) {
            map.set(v[keyField], v);
            added = true;
          }
        }
      } else {
        if (!map.has(value[keyField])) {
          map.set(value[keyField], value);
          added = true;
        }
      }
      if (added) {
        forceRender({});
      }
    },
    [map, keyField],
  );

  const remove = useCallback(
    (value: T) => {
      map.delete(value[keyField]);
      forceRender({});
    },
    [map, keyField],
  );

  return [Array.from(map.values()), add, remove] as const;
}

function App({ sounds }: AppProps) {
  const localAccount = useAuth();
  const [users, addUser, removeUser] = useMap<Account>('id');
  const client = useClient();

  useEffect(() => {
    client.query(GetUsersInRoom, { room: 'singleroom' }).then(({ data }) => {
      addUser(
        data?.room?.people?.filter(
          (user: any) => user.id !== localAccount.id,
        ) ?? [],
      );
    });
  }, []);

  const handleSubscription = useCallback((_: any, data: RoomEvent) => {
    const event = data.room;

    if (event?.__typename === 'SoundEvent') {
      const from = event.from;
      const { name, soundUrl } = event.sound;
      if (name && soundUrl) {
        playSound(soundUrl, volume.value);
        toast(
          <span>
            {name} <span style={{ fontWeight: 600, fontSize: 20 }}>{from}</span>
          </span>,
          {
            duration: 1000,
            style: {
              position: 'absolute',
              top: `${randomPosition()}vh`,
              left: `${randomPosition()}vw`,
              pointerEvents: 'none',
            },
          },
        );
      }
    }

    if (event?.__typename === 'AddEvent') {
      addUser({ name: event.name, id: event.id });
    }

    if (event?.__typename === 'RemoveEvent') {
      removeUser({ name: event.name, id: event.id });
    }

    return [];
  }, []);

  const subVariables = useMemo(
    () => ({ accountName: localAccount.name, accountId: localAccount.id }),
    [localAccount.name, localAccount.id],
  );

  useSubscription(
    {
      query: RoomSubscription,
      variables: subVariables,
      pause: false,
    },
    handleSubscription,
  );

  return (
    <div className={styles.container}>
      <h1>Quack Quack 🦆!</h1>
      <div>
        Users: {localAccount.name}
        {users.length > 0 ? ', ' : ''}
        {users.map((account) => account.name).join(', ')}
      </div>
      <a href='/leaderboard'>Leaderboard</a>
      <AddSoundForm />
      <SoundBoard sounds={sounds} account={localAccount} />
    </div>
  );
}

const SoundsQuery = graphql(`
  query getSounds {
    sounds {
      emoji
      name
      soundUrl
      description
    }
  }
`);

export function SongLoader() {
  const [result] = useQuery({
    query: SoundsQuery,
  });
  const sounds = result?.data?.sounds ?? [];

  return (
    <AuthScreen>
      <App sounds={sounds} />
      <Toaster />
    </AuthScreen>
  );
}
