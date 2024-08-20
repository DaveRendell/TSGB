
interface RomRegion {
  name: "ROM"
  bank: number
}

interface VramRegion {
  name: "VRAM"
  bank: number
}

interface SramRegion {
  name: "SRAM"
  bank: number
}

interface WramRegion {
  name: "WRAM"
  bank: number
}

interface EchoRamRegion {
  name: "Echo - WRAM"
  bank: number
}

interface OamRegion {
  name: "OAM"
}

interface ForbiddenRegion {
  name: "Forbidden"
}

interface IoRegion {
  name: "I/O Registers"
}

interface HramRegion {
  name: "HRAM"
}

type MemoryRegion =
  RomRegion
  | VramRegion
  | SramRegion
  | WramRegion
  | EchoRamRegion
  | OamRegion
  | ForbiddenRegion
  | IoRegion
  | HramRegion

export default MemoryRegion

export function areEqual(region1: MemoryRegion, region2: MemoryRegion): boolean {
  if (region1.name !== region2.name) { return false }

  if ("bank" in region1) {
    if (!("bank" in region2)) { return false } // unhittable, but for types
    if (region1.bank !== region2.bank) { return false }
  }

  return true
}
