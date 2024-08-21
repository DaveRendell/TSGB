import Memory from "../memory/memoryMap";
import findSection from "./findSection";
import { DebugMap, Symbol } from "./types";

export default function findSymbol(
  debugMap: DebugMap,
  address: number,
  memory: Memory,
): Symbol | undefined {
  const section = findSection(debugMap, address, memory)

  if (!section) { return undefined }

  return section.symbols
    .filter(symbol => symbol.address <= address)
    .at(-1)
}