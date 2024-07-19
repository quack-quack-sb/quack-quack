export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  File: { input: any; output: any; }
};

export type Account = {
  __typename: 'Account';
  id: Scalars['String']['output'];
  name: Scalars['String']['output'];
};

export type AddEvent = {
  __typename: 'AddEvent';
  id: Scalars['String']['output'];
  name: Scalars['String']['output'];
  type: Scalars['String']['output'];
};

export type HonkEvent = AddEvent | RemoveEvent | SoundEvent;

export type Mutation = {
  __typename: 'Mutation';
  addSound: Sound;
  deleteSound: Sound;
  honk: Scalars['Boolean']['output'];
  join: Account;
};


export type MutationAddSoundArgs = {
  emoji: Scalars['String']['input'];
  file: Scalars['File']['input'];
  name: Scalars['String']['input'];
};


export type MutationDeleteSoundArgs = {
  soundName: Scalars['String']['input'];
};


export type MutationHonkArgs = {
  from: Scalars['String']['input'];
  name: Scalars['String']['input'];
  room?: Scalars['String']['input'];
};


export type MutationJoinArgs = {
  name: Scalars['String']['input'];
  room?: Scalars['String']['input'];
};

export type Query = {
  __typename: 'Query';
  room: Room;
  sounds: Array<Sound>;
};


export type QueryRoomArgs = {
  name?: Scalars['String']['input'];
};

export type RemoveEvent = {
  __typename: 'RemoveEvent';
  id: Scalars['String']['output'];
  name: Scalars['String']['output'];
  type: Scalars['String']['output'];
};

export type Room = {
  __typename: 'Room';
  name: Scalars['String']['output'];
  people: Array<Account>;
  sounds: Array<Sound>;
};

export type Sound = {
  __typename: 'Sound';
  description: Scalars['String']['output'];
  emoji: Scalars['String']['output'];
  name: Scalars['String']['output'];
  soundUrl: Scalars['String']['output'];
};

export type SoundEvent = {
  __typename: 'SoundEvent';
  from: Scalars['String']['output'];
  sound: Sound;
  type: Scalars['String']['output'];
};

export type SoundInput = {
  description: Scalars['String']['input'];
  emoji: Scalars['String']['input'];
  name: Scalars['String']['input'];
  soundUrl: Scalars['String']['input'];
};

export type Subscription = {
  __typename: 'Subscription';
  room?: Maybe<HonkEvent>;
};


export type SubscriptionRoomArgs = {
  accountId: Scalars['String']['input'];
  accountName: Scalars['String']['input'];
};
