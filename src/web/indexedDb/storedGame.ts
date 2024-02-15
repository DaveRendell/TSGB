import { Rtc } from "../../emulator/memory/cartridges/realTimeClock/rtc"

export interface StoredGame {
  id: number
  title: string
  data: Uint8Array
  save?: Uint8Array
  boxart?: File
  rtc?: Rtc | undefined
}