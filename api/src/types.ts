import type { Sounds } from './durable-objects/Sounds';

export interface Env {
  ROOMS: DurableObjectNamespace;
  LEADERBOARDS: DurableObjectNamespace;
  SOUNDS: DurableObjectNamespace<Sounds>;
  SOUNDS_BUCKET: R2Bucket;
  API_URL: string;
}
