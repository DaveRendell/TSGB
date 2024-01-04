export interface StoredGame {
  id: number
  title: string
  data: Uint8Array
  save?: Uint8Array
}