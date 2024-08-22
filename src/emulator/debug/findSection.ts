import Memory from "../memory/memoryMap";
import { DebugMap, Section } from "./types";

export default function findSection(
  debugMap: DebugMap,
  address: number,
  memory: Memory,
): Section | undefined{
  const region = memory.getRegion(address)

  const sections = debugMap[region.name][region.bank]

  if (!sections) { return undefined }

  return sections.find(section =>
    section.start <= address && section.end >= address
  )
}