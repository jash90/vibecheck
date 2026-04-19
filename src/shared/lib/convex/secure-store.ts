import * as SecureStore from 'expo-secure-store';

// expo-secure-store has a ~2048-byte limit on iOS. Convex Auth JWTs can
// exceed that and fail silently, blocking session persistence. We chunk
// any oversized value into numbered sub-keys and store a header marker
// under the original key so reads can stitch the pieces back together.

const CHUNK_SIZE = 1800;
const CHUNK_HEADER = '__chunked:';

function chunkKey(key: string, index: number) {
  return `${key}:${index}`;
}

async function clearChunks(key: string, header: string | null) {
  if (!header || !header.startsWith(CHUNK_HEADER)) return;
  const count = Number(header.slice(CHUNK_HEADER.length));
  if (!Number.isFinite(count) || count <= 0) return;
  await Promise.all(
    Array.from({ length: count }, (_, i) => SecureStore.deleteItemAsync(chunkKey(key, i))),
  );
}

export const secureStorage = {
  async getItem(key: string): Promise<string | null> {
    const header = await SecureStore.getItemAsync(key);
    if (header == null) return null;
    if (!header.startsWith(CHUNK_HEADER)) return header;

    const count = Number(header.slice(CHUNK_HEADER.length));
    if (!Number.isFinite(count) || count <= 0) return null;

    const parts: string[] = [];
    for (let i = 0; i < count; i++) {
      const part = await SecureStore.getItemAsync(chunkKey(key, i));
      if (part == null) return null;
      parts.push(part);
    }
    return parts.join('');
  },

  async setItem(key: string, value: string): Promise<void> {
    const prev = await SecureStore.getItemAsync(key);
    await clearChunks(key, prev);

    if (value.length <= CHUNK_SIZE) {
      await SecureStore.setItemAsync(key, value);
      return;
    }

    const parts: string[] = [];
    for (let i = 0; i < value.length; i += CHUNK_SIZE) {
      parts.push(value.slice(i, i + CHUNK_SIZE));
    }
    await Promise.all(
      parts.map((part, i) => SecureStore.setItemAsync(chunkKey(key, i), part)),
    );
    await SecureStore.setItemAsync(key, `${CHUNK_HEADER}${parts.length}`);
  },

  async removeItem(key: string): Promise<void> {
    const header = await SecureStore.getItemAsync(key);
    await clearChunks(key, header);
    await SecureStore.deleteItemAsync(key);
  },
};
