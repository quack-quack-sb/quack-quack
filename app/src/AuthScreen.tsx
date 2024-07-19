import {
  useState,
  useEffect,
  useCallback,
  useContext,
  createContext,
  PropsWithChildren,
  FormEvent,
} from 'react';
import { gql, useMutation } from 'urql';
import * as styles from './AuthScreen.css';
import { graphql } from './lib/graphql';

export type Account = {
  name: string;
  id: string;
};

type Context = Account;

const AuthContext = createContext<undefined | Context>(undefined);

type Props = PropsWithChildren<{}>;

const ACCOUNT_STORAGE_KEY = '@qq/account';

function getStoredAccount() {
  const account = window.localStorage.getItem(ACCOUNT_STORAGE_KEY);
  if (account != null) {
    const parsedAccount = JSON.parse(account) as Account;
    return parsedAccount;
  }
}

const JoinMutation = graphql(`
  mutation Join($name: String!, $room: String!) {
    join(name: $name, room: $room) {
      id
      name
    }
  }
`);

export const AuthScreen = ({ children }: Props) => {
  const [account, setAccount] = useState<undefined | Account>(undefined);
  const [name, setName] = useState('');
  const [joinResult, join] = useMutation(JoinMutation);

  useEffect(() => {
    const storedAccount = getStoredAccount();
    if (storedAccount) {
      join({ name: storedAccount.name, room: 'singleroom' }).then((result) => {
        if (result.data?.join) {
          const account: Account = {
            ...result.data.join,
          };
          setAccount(account);
        }
      });
    }
  }, []);

  const onSubmit = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const result = await join({ name, room: 'singleroom' });
      if (result.data?.join) {
        const account: Account = {
          ...result.data.join,
        };
        window.localStorage.setItem(
          ACCOUNT_STORAGE_KEY,
          JSON.stringify(account),
        );
        setAccount(account);
      }
    },
    [name],
  );

  if (!account) {
    return (
      <div className={styles.container}>
        <h1 className={styles.header}>Quack Quack 🦆</h1>
        <p>
          Video conference calls don't have to be boring. Quack Quack 🦆 let's
          you bring your meetings to life with a personalised sound board.
        </p>
        <br />
        <p>Quack Quack 🦆 was made with love and hilarious sounds.</p>
        <br />
        <form onSubmit={onSubmit}>
          <input
            className={styles.input}
            value={name}
            onChange={(e) => setName(e.currentTarget.value)}
            placeholder='Enter your name'
            id='name'
          />
          <button className={styles.button} type='submit'>
            Get quacking 🦆
          </button>
        </form>
        <img
          className={styles.image}
          src='https://i1.sndcdn.com/avatars-000217906618-gvo7fr-t500x500.jpg'
          alt=''
        />
      </div>
    );
  }

  return (
    <AuthContext.Provider value={account}>{children}</AuthContext.Provider>
  );
};

export function useAuth(): Context {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('Auth must be present');
  }
  return context;
}
