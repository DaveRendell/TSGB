import findSection from "../../../emulator/debug/findSection"
import findSymbol from "../../../emulator/debug/findSymbol"
import { Emulator } from "../../../emulator/emulator"

export default function describeAddress(address: number, emulator: Emulator) {
  if (!emulator.debugMap) {
    return undefined
  }

  const symbol = findSymbol(emulator.debugMap, address, emulator.memory)

  if (!symbol) {
    const section = findSection(emulator.debugMap, address, emulator.memory)
    if (!section) {
      return undefined
    }
    return `${section.name}+${address - section.start}`
  }

  if (symbol.address === address) {
    return `${symbol.name}`
  }

  return `${symbol.name}+${address - symbol.address}`
}