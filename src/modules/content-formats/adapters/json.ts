import type { ContentFormatAdapter } from "../types";

export function createJsonAdapter<T>(): ContentFormatAdapter<T> {
  return {
    extension: ".json",
    serialize: (data) => JSON.stringify(data, null, 2),
    deserialize: (text) => JSON.parse(text) as T,
  };
}
