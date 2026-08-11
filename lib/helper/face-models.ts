type ModelLoader = () => Promise<unknown>;

const modelLoaders = new Map<string, Promise<void>>();

export function ensureFaceModelLoaded(key: string, loaders: ModelLoader[]) {
  const existing = modelLoaders.get(key);
  if (existing) return existing;

  const promise = loaders
    .reduce<Promise<void>>(
      (sequence, loader) => sequence.then(async () => { await loader(); }),
      Promise.resolve(),
    )
    .catch((error) => {
      modelLoaders.delete(key);
      throw error;
    });
  modelLoaders.set(key, promise);
  return promise;
}
