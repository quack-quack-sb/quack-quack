import { useCallback, useMemo, useRef, useState } from 'react';
import { useMutation } from 'urql';
import { playSound } from '@/lib/sound';
import { Sound } from '@/types';
import { Account } from '@/AuthScreen';
import { VolumeControl, volume } from '@/VolumeControl';
import { SoundButton, SoundLabel } from '@/components/SoundButton/SoundButton';
import * as styles from './SoundBoard.css';
import emoji from 'emojis-list';
import { graphql } from '@/lib/graphql';

type SoundBoardProps = {
  sounds: Sound[];
  account: Account;
};

const HonkMutation = graphql(`
  mutation HonkMutation($room: String!, $name: String!, $from: String!) {
    honk(room: $room, name: $name, from: $from)
  }
`);

function getUnassignedEmoji(sounds: Sound[]) {
  const usedEmojis = sounds
    .filter((sound: Sound) => sound.emoji)
    .map((sound: Sound) => sound.emoji);
  return emoji
    .filter((x: string) => !usedEmojis.includes(x))
    .sort(() => 0.5 - Math.random());
}

export function SoundBoard({ sounds, account }: SoundBoardProps) {
  const playLocallyInputRef = useRef<HTMLInputElement>(null);
  const [, honk] = useMutation(HonkMutation);
  const play = useCallback(
    (sound: Sound) => {
      if (playLocallyInputRef.current?.checked) {
        playSound(sound.soundUrl, volume.value);
      } else {
        honk({
          room: 'singleroom',
          from: account.name,
          name: sound.name,
        });
      }
    },
    [account.name],
  );
  let [showWantedSounds, setShowWantedSounds] = useState(false);
  const unassignedEmoji = useMemo(() => getUnassignedEmoji(sounds), [sounds]);

  return (
    <div>
      <VolumeControl />
      <label>
        <input type='checkbox' ref={playLocallyInputRef} /> only play sounds
        locally
      </label>
      <ul className={styles.board}>
        {sounds.map((sound: Sound) => (
          <li className={styles.cell} key={sound.name}>
            <SoundButton key={sound.name} sound={sound} play={play} />
          </li>
        ))}
      </ul>

      <button
        className={styles.toggle}
        onClick={() => setShowWantedSounds(!showWantedSounds)}
      >
        Show wanted sounds
      </button>
      {!showWantedSounds ? (
        <></>
      ) : (
        <ul className={styles.board}>
          {unassignedEmoji.map((emoji: string) => (
            <li className={styles.cell} key={emoji}>
              <SoundLabel key={emoji} emoji={emoji} name='Wanted' />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
