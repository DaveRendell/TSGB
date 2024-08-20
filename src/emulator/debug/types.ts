export const MemoryRegions = {
  rom: "rom",
  vram: "vram",
  sram: "sram",
  wram: "wram",
  echo: "echo",
  oam: "oam",
  forbidden: "forbidden",
  ioRegisters: "ioRegisters",
  hram: "hram"
} as const

export type MemoryRegion = keyof typeof MemoryRegions

export type DebugMap = Record<MemoryRegion, Bank[]>

type Bank = Section[]

export interface Section {
  name: string
  start: number
  end: number // Note: inclusive
  symbols: Symbol[]
}

export interface Symbol {
  address: number
  name: string
}
