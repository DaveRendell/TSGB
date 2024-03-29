import * as React from "react"
import { Emulator } from "../../emulator/emulator"
import Memory from "../../emulator/memory/memoryMap"
import "./pkmnGen1Dashboard.css"

interface Props {
  emulator: Emulator
}

export default function PkmnGen1Dashboard({ emulator }: Props) {
  const party = getParty(emulator.memory)

  return (
    <section className="pkmn-gen-1-dashboard">
      <h2>Trainer {readStringAt(emulator.memory, 0xd158)}</h2>
      {party.map((monster, i) => (
        <article className="monster" key={i}>
          <h4 className="sentence-case">{monster.dexId} {monster.name.toLowerCase()} - Level {monster.level}</h4>
          <div className="status-bars">
            <div>
              <progress className="hp-bar" max={monster.maxHp} value={monster.hp} />
              <br />
              <strong>Hit points:</strong> {monster.hp} / {monster.maxHp}
            </div>
            <div>
              <progress className="xp-bar" max={monster.xpRequired} value={monster.xpThisLevel} />
              <br />
              <strong>XP for level up:</strong> {monster.xpRequired - monster.xpThisLevel} 
            </div>
          </div>
          
          <br/>
          
        </article>
      ))}
    </section>
  )
}

function readStringAt(memory: Memory, start: number): string {
  let codes: number[] = []
  for (let addr = start; addr <= start + 64; addr++) {
    const code = memory.at(addr).byte
    if (code == 0x50) {
      break
    }
    codes.push(memory.at(addr).byte)
  }
  return codes.map(decodeString).join("")
}

function decodeString(code: number): string {
  if (code <= 0x99) {
    return String.fromCharCode(code - 0x80 + 65)
  }
  return String.fromCharCode(code - 0xa0 + 97)
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
  const count = memory.at(0xd163).byte
  let party: Monster[] = []
  for (let i = 0; i < count; i++) {
    party.push(decodePartyMonster(memory, i))
  }
  return party
}

function decodePartyMonster(memory: Memory, i: number): Monster {
  const id = memory.at(0xd16b + i * 44).byte
  const name = readStringAt(memory, 0xd2b5 + i * 11)
  const hp =
    0x100 * memory.at(0xd16c + i * 44).byte + memory.at(0xd16d + i * 44).byte
  const maxHp =
    0x100 * memory.at(0xd18d + i * 44).byte + memory.at(0xd18e + i * 44).byte

  const xp =
    0x10000 * memory.at(0xd179 + i * 44).byte +
    0x100 * memory.at(0xd17a + i * 44).byte +
    memory.at(0xd17b + i * 44).byte

  const { dexId, growthRate } = getMonsterStats(memory, id)

  const level = memory.at(0xd18c + i * 44).byte
  const levelFormula = LEVEL_FORMULAE[growthRate]
  const xpThisLevel = xp - levelFormula(level)
  const xpRequired = levelFormula(level + 1) - levelFormula(level)

  // console.log(name, growthRate, xp)

  return {
    id,
    name,
    hp,
    maxHp,
    dexId,
    growthRate,
    level,
    xp,
    xpThisLevel,
    xpRequired,
  }
}

interface MonsterStats {
  dexId: number
  growthRate: number
}

function getMonsterStats(memory: Memory, id: number): MonsterStats {
  const orderedId = memory.cartridge.romData[0x41024 + id - 1]

  const baseAddress = 0x0383de + orderedId * 28

  const dexId = memory.cartridge.romData[baseAddress] - 1
  const growthRate = memory.cartridge.romData[baseAddress + 0x13]

  return { dexId, growthRate }
}

const LEVEL_FORMULAE = {
  0: (level: number): number => Math.floor(level * level * level),
  3: (level: number): number =>
    Math.floor(
      (6 / 5) * level * level * level - 15 * level * level + 100 * level - 140,
    ),
  4: (level: number): number => Math.floor(
    (6 / 5) * level * level * level - 15 * level * level + 100 * level - 140,
  ),
  5: (level: number): number => Math.floor((5 / 4) * level * level * level),
}
