import * as React from "react"
import { Emulator } from "../../emulator/emulator"
import Memory from "../../emulator/memory"

interface Props {
  emulator: Emulator
}

export default function PkmnGen1Dashboard({ emulator }: Props) {
  const party = getParty(emulator.memory)

  return (
    <section>
      <h2>Dashboard</h2>
      Player name: {readStringAt(emulator.memory, 0xD158)}
      <h3>Party - {party.length} / 6</h3>
      { party.map((monster, i) =>
        <article key={i}>
          <h4>{monster.name}</h4>
          hp: {monster.hp} / {monster.maxHp}<br/><progress max={monster.maxHp} value={monster.hp}/><br/>
          Level {monster.level} - {monster.xpRequired - monster.xpThisLevel} for level up<br/>
          <progress max={monster.xpRequired} value={monster.xpThisLevel}/>
        </article>
      )}
    </section>
  )
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

interface Monster {
  id: number
  name: string
  hp: number
  maxHp: number
  dexId: number
  growthRate: number
  level: number
  xp: number
  xpThisLevel: number
  xpRequired: number
}

function getParty(memory): Monster[] {
  const count = memory.at(0xD163).value
  let party: Monster[] = []
  for (let i = 0; i < count; i++) {
    party.push(decodePartyMonster(memory, i))
  }
  return party
}

function decodePartyMonster(memory: Memory, i: number): Monster {
  const id = memory.at(0xD16B + i * 44).value
  const name = readStringAt(memory, 0xD2B5 + i * 11)
  const hp = 0x100 * memory.at(0xD16C + i * 44).value + memory.at(0xD16D + i * 44).value
  const maxHp = 0x100 * memory.at(0xD18D + i * 44).value + memory.at(0xD18E + i * 44).value

  const xp = 0x10000 * memory.at(0xD179 + i * 44).value
    + 0x100 * memory.at(0xD17A + i * 44).value
    + memory.at(0xD17B + i * 44).value

  const { dexId, growthRate } = getMonsterStats(memory, id)

  const level = memory.at(0xD18C + i * 44).value
  const levelFormula = LEVEL_FORMULAE[growthRate]
  const xpThisLevel = xp - levelFormula(level)
  const xpRequired = levelFormula(level + 1) - levelFormula(level)

  return { id, name, hp, maxHp, dexId, growthRate, level, xp, xpThisLevel, xpRequired }
}

interface MonsterStats {
  dexId: number
  growthRate: number
}

function getMonsterStats(memory: Memory, id: number): MonsterStats {
  const orderedId = memory.cartridge.romData[0x41024 + id - 1]

  const baseAddress = 0x0383DE + orderedId * 28

  const dexId = memory.cartridge.romData[baseAddress] - 1
  const growthRate = memory.cartridge.romData[baseAddress + 0x13]

  return { dexId, growthRate }
}

const LEVEL_FORMULAE = {
  0: (level: number): number => Math.floor(level * level * level),
  3: (level: number): number => Math.floor((6 / 5) * level * level * level - 15 * level * level + 100 * level - 140),
  4: (level: number): number => Math.floor((4 / 5) * level * level * level),
  5: (level: number): number => Math.floor((5 / 4) * level * level * level),
}