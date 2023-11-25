export type Register8Name = "A" | "B" | "C" | "D" | "E" | "H" | "L" | "F"
export type Register16Name = "HL" | "PC" | "SP" | "BC" | "DE" | "AF"
export type FlagName = "Zero" | "Operation" | "Half-Carry" | "Carry"

export interface MutableValue<IntSize extends number> {
  intSize?: IntSize
  read(): number
  write(value: number): void
}
