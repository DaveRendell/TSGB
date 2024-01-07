import * as React from "react"
import { Emulator } from "../../emulator/emulator"
import Memory from "../../emulator/memory"

interface Props {
  emulator: Emulator
}

export default function PkmnGen1Dashboard({ emulator }: Props) {


  return (
    <section>
      <h2>Dashboard</h2>
      Player name: {getPlayerName(emulator.memory)}
    </section>
  )
}

function getPlayerName(memory: Memory): string {
  return readStringAt(memory, 0xD158)
}

function readStringAt(memory: Memory, start: number): string {
  let codes: number[] = []
  for (let addr = start; addr <= start + 64; addr++) {
    const code = memory.at(addr).value
    if (code == 0x50) { break }
    codes.push(memory.at(addr).value)
  }
  return codes.map(decodeString).join("")
}

function decodeString(code: number): string {
  if (code <= 0x99) { return String.fromCharCode((code - 0x80) + 65) }
  return String.fromCharCode((code - 0xA0) + 97)
}