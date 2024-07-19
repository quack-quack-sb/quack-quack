import { useState } from 'react';
import slugify from 'slugify';
import * as Dialog from '@radix-ui/react-dialog';
import * as styles from './AddSoundForm.css';
import { useMutation } from 'urql';
import { graphql } from '@/lib/graphql';

const AddSoundMutation = graphql(`
  mutation AddSound($name: String!, $emoji: String!, $file: File!) {
    addSound(name: $name, emoji: $emoji, file: $file) {
      name
      emoji
      soundUrl
      description
    }
  }
`);

export function AddSoundForm() {
  const [emoji, setEmoji] = useState('');
  const [name, setName] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [open, setOpen] = useState(false);
  const [addSoundResult, addSound] = useMutation(AddSoundMutation);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button style={{ alignSelf: 'center' }}>Add Sound</button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className={styles.overlay} />
        <Dialog.Content className={styles.content}>
          <Dialog.Title>Add Sound</Dialog.Title>
          <Dialog.Description>
            Add your very own quack quack sound!!!
          </Dialog.Description>
          <form
            onSubmit={async (event) => {
              event.preventDefault();
              if (addSoundResult.fetching) {
                return;
              }
              if (file && name && emoji) {
                await addSound(
                  {
                    emoji,
                    name,
                    file,
                  },
                  {
                    fetchOptions: {
                      headers: {
                        'what-does-the-goose-say': 'honk',
                      },
                    },
                  },
                );
                setOpen(false);
              }
            }}
          >
            <input
              type='file'
              onChange={(event) => {
                if (event.target.files !== null) {
                  const file = event.target.files[0];
                  if (file.name.match('-_QQ_-')) {
                    // small utility name so we can reupload all of our internal sounds to cloudflare R2/Durable Objects easily
                    // we will remove this once we migrate our sounds
                    const [emoji, fileName] = file.name.split('-_QQ_-');
                    const [name, extension] = fileName.split('.');

                    const safeFileName = `${makeFileNameSafeUrlSafe(
                      name,
                    )}.${extension}`;

                    const modifiedFile = new File([file], safeFileName, {
                      type: file.type,
                      lastModified: file.lastModified,
                    });

                    setEmoji(emoji);
                    setName(name);
                    setFile(modifiedFile);
                  } else {
                    const fileName = file.name;
                    const [name, extension] = fileName.split('.');

                    const safeFileName = `${makeFileNameSafeUrlSafe(
                      name,
                    )}.${extension}`;

                    const modifiedFile = new File([file], safeFileName, {
                      type: file.type,
                      lastModified: file.lastModified,
                    });

                    setFile(modifiedFile);
                  }
                }
              }}
              accept='audio/*'
            />
            <input
              type='text'
              name='name'
              value={name}
              onChange={(e) => setName(e.currentTarget.value)}
              placeholder='Sound name'
            />
            <input
              type='text'
              name='emoji'
              value={emoji}
              onChange={(e) => setEmoji(e.currentTarget.value)}
              placeholder='Emoji'
            />
            <button disabled={addSoundResult.fetching} type='submit'>
              add sound
            </button>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function makeFileNameSafeUrlSafe(fileName: string) {
  return slugify(fileName, {
    lower: true,
    strict: true,
  });
}
