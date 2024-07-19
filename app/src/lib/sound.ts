import { Howl } from 'howler';

export function playSound(soundUrl: string, volume: number = 0.5) {
  const sound = new Howl({
    src: [soundUrl],
    volume,
  });
  sound.play();
}
