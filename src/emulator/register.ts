import { Register8Name, Register16Name, FlagName, MutableValue } from "../types"

const FLAG_MASKS: Record<FlagName, number> = {
  "Zero":       0b10000000,
  "Operation":  0b01000000,
  "Half-Carry": 0b00100000,
  "Carry":      0b00010000,
}

export default class CpuRegisters {
  private values8Bit: Record<Register8Name, number> = {
    "A": 0,
    "B": 0,
    "C": 0,
    "D": 0,
    "E": 0,
    "H": 0,
    "L": 0,
    "F": 0,
  }

  private values16Bit: Partial<Record<Register16Name, number>> = {
    "PC": 0,
    "SP": 0,
  }

  get8 = (name: Register8Name): MutableValue<8> => ({
    intSize: 8,
    read: () => this.values8Bit[name],
    write: (value) => name === "F"
      ? this.values8Bit[name] = (value & 0xF0)
      : this.values8Bit[name] = (value & 0xFF)
  })

  get16 = (name: Register16Name): MutableValue<16> =>
    name == "PC" || name == "SP"
      ? {
        intSize: 16,
        read: () => this.values16Bit[name],
        write: (value) => this.values16Bit[name] = value
      }
      : {
        intSize: 16,
        read: () => {
          const h = this.values8Bit[name[0]]
          const l = this.values8Bit[name[1]]
          return (h << 8) + l
        },
        write: (value) => {
          const h = (value & 0xFF00) >> 8
          const l = value & 0x00FF
          this.values8Bit[name[0]] = h
          if (name === "AF") {
            this.values8Bit[name[1]] = (l & 0xF0)
          } else {
            this.values8Bit[name[1]] = l
          }
        }
      }

  getFlag = (name: FlagName): MutableValue<1> => ({
    intSize: 1,
    read: () => (this.values8Bit["F"] & FLAG_MASKS[name]) === 0 ? 0 : 1,
    write: (value) => this.values8Bit["F"] = value
      ? this.values8Bit["F"] | FLAG_MASKS[name]
      : this.values8Bit["F"] & ~FLAG_MASKS[name]
  })
}