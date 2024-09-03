import { DebugMap, MemoryRegion, Section } from "./types";

export default async function parseMap(file: File): Promise<DebugMap> {
  const fileString = await readString(file)
  const paragraphs = fileString.split(/\r?\n\r?\n/)
    .map(paragraph => paragraph.split(/\r?\n/))

  const debugMap: DebugMap = {
    rom: [],
    vram: [],
    sram: [],
    wram: [],
    echo: [],
    oam: [],
    forbidden: [],
    ioRegisters: [],
    hram: [],
  }

  paragraphs.forEach(paragraph => parseParagraph(paragraph, debugMap))

  return debugMap
}

async function readString(file: File): Promise<string> {
  const reader = new FileReader()
  return new Promise((resolve, reject) => {
    reader.onload = (event) => {
      if (typeof reader.result === "string") {
        resolve(reader.result)
      } else {
        const decoder = new TextDecoder("utf-8")
        resolve(decoder.decode(reader.result))
      }
    }
    reader.readAsText(file)
  })
}

function parseParagraph(paragraph: string[], debugMap: DebugMap): void {
  const titleLine = paragraph[0]
  if (titleLine.startsWith("SUMMARY")) { return }

  const headerName = Object.keys(headerToRegion)
    .find(header => titleLine.startsWith(header))

  if (headerName) {
    const bankNumber = parseInt(titleLine.split(" ")[2].slice(1, -1))
    debugMap[headerToRegion[headerName]][bankNumber] = paragraph.slice(1).reduce(toSections, [])
  } else {
    console.warn("[DEBUG MAP PARSER] Unknown region header", titleLine)
  }
}

const toSections = (sections: Section[], line: string): Section[] => {
  const trimmedLine = line.trimStart()
  if (trimmedLine.startsWith("SECTION")) {
    const name = trimmedLine.split(" ").slice(4).join(" ").slice(2, -2)

    const range = trimmedLine.split(" ")[1]
    let start: number, end: number
    if (range.includes("-")) {
      [start, end] = range.split("-")
        .map(str => parseInt("0x" + str.slice(1)))
    } else {
      start = end = parseInt("0x" + range.slice(1))
    }
    
    return [...sections, {
      name, start, end, symbols: []
    }]
  } else if (trimmedLine.startsWith("EMPTY")) {
    // Check if whole bank is empty
    if (trimmedLine === "EMPTY") {
      return [{
        name: "EMPTY", start: 0x4000, end: 0x8000, symbols: []
      }]
    }
    const range = trimmedLine.split(" ")[1]
    let start: number, end: number
    if (range.includes("-")) {
      [start, end] = range.split("-")
        .map(str => parseInt("0x" + str.slice(1)))
    } else {
      start = end = parseInt("0x" + range.slice(1))
    }
    
    return [...sections, {
      name: "EMPTY", start, end, symbols: []
    }]
  } else {
    const name = trimmedLine.split(" = ")[1]
    const address = parseInt("0x" + trimmedLine.split(" = ")[0].slice(1))
    sections.at(-1).symbols.push({
      address, name
    })
    return sections
  }
}

const headerToRegion: Record<string, MemoryRegion> = {
  "ROM": "rom",
  "VRAM": "vram",
  "SRAM": "sram",
  "WRAM": "wram",
  "HRAM": "hram",
}