import * as ContextMenu from '@radix-ui/react-context-menu';
import { Sound } from '@/types';
import * as styles from './SoundButton.css';
import { useMutation } from 'urql';
import { graphql } from '@/lib/graphql';

type SoundButtonProps = {
  sound: Sound;
  play(sound: Sound): void;
};

const DeleteSoundMutation = graphql(`
  mutation DeleteSound($soundName: String!) {
    deleteSound(soundName: $soundName) {
      name
      emoji
      soundUrl
      description
    }
  }
`);

export function SoundButton({ sound, play }: SoundButtonProps) {
  const { emoji, name } = sound;

  const [_, deleteSound] = useMutation(DeleteSoundMutation);

  function handleDelete() {
    deleteSound(
      {
        soundName: name,
      },
      {
        fetchOptions: {
          headers: {
            'what-does-the-goose-say': 'honk',
          },
        },
      },
    );
  }

  return (
    <ContextMenu.Root>
      <ContextMenu.Trigger className={styles.label}>
        <label title={name}>
          <button className={styles.button} onClick={() => play(sound)}>
            <span>{emoji}</span>
          </button>
          {name}
        </label>
      </ContextMenu.Trigger>
      <ContextMenu.Portal>
        <ContextMenu.Content className={styles.menuContent}>
          <ContextMenu.Item onSelect={handleDelete} className={styles.menuItem}>
            Delete <span aria-hidden='true'>🗑️</span>
          </ContextMenu.Item>
        </ContextMenu.Content>
      </ContextMenu.Portal>
    </ContextMenu.Root>
  );
}

export function SoundLabel({ emoji, name }: Pick<Sound, 'emoji' | 'name'>) {
  return (
    <div className={styles.label}>
      <label title={name}>
        <div className={styles.button}>
          <span>{emoji}</span>
        </div>
        {name}
      </label>
    </div>
  );
}
