import { DurableObject } from 'cloudflare:workers';
import type { Env } from '../types';

type Input = {
  name: string;
  emoji: string;
  description: string;
  file: ReadableStream;
  fileName: string;
};

type Sound = {
  name: string;
  emoji: string;
  description: string;
  soundUrl: string;
};

export class Sounds extends DurableObject<Env> {
  async addSound(input: Input, storagePrefix: string) {
    if (!storagePrefix) {
      throw new Error('storage prefix is required for storage namespacing');
    }

    const currentSound = await this.ctx.storage.get<Sound>(input.name);
    if (currentSound !== undefined) {
      throw new Error('Sound already exists');
    }

    // prefix are used to identify the team that uploaded the sound
    const fileName = `${storagePrefix}/${input.fileName}`;

    const r2Object = await this.env.SOUNDS_BUCKET.put(fileName, input.file);

    if (r2Object === null) {
      throw new Error('Failed to upload sound');
    }

    const sound: Sound = {
      name: input.name,
      emoji: input.emoji,
      description: input.description,
      // serving the sound file itself is handled in index.ts routes
      soundUrl: `${this.env.API_URL}/sounds/${fileName}`,
    };

    await this.ctx.storage.put<Sound>(input.name, sound);

    return sound;
  }

  async deleteSound(soundName: string) {
    const sound = await this.ctx.storage.get<Sound>(soundName);

    if (sound === undefined) {
      throw new Error('Sound does not exist');
    }

    const fileName = sound.soundUrl.replace('/sounds/', '');
    await Promise.all([
      this.env.SOUNDS_BUCKET.delete(fileName),
      this.ctx.storage.delete(soundName),
    ]);

    return sound;
  }

  async getSounds() {
    const sounds = await this.ctx.storage.list<Sound>();
    return Array.from(sounds.values());
  }

  async getSound(soundName: string) {
    return await this.ctx.storage.get<Sound>(soundName);
  }
}
