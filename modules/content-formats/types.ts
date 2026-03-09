export interface ContentFormatAdapter<T> {
  readonly extension: string;
  serialize(data: T): string;
  deserialize(text: string): T;
}
