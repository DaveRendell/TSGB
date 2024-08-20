import { MemoryRegion } from "./types"

export type DebugMap = Record<MemoryRegion, Bank[]>

type Bank = Section[]

interface Section {
  name: string
  start: number
  end: number // Note: inclusive
  symbols: Symbol[]
}

interface Symbol {
  address: number
  name: string
}