import { signal, effect } from '@preact/signals-react';

const DEFAULT_VOLUME = 0.5;
const VOLUME_STORAGE_KEY = '@qq/volume';

const storedValue = window.localStorage.getItem(VOLUME_STORAGE_KEY);

export const volume = signal(
  storedValue != null ? parseFloat(storedValue) : DEFAULT_VOLUME,
);

effect(() => {
  window.localStorage.setItem(VOLUME_STORAGE_KEY, volume.value.toString());
});

export function VolumeControl() {
  return (
    <div>
      <label htmlFor='volume'>Volume</label>
      <input
        id='volume'
        type='range'
        min='0'
        max='100'
        value={volume.value * 100}
        onChange={(event) => {
          const value = event.currentTarget.valueAsNumber;
          volume.value = Math.max(0, Math.min(value, 100)) / 100;
        }}
      />
    </div>
  );
}
