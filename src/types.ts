export type Register8Name = "A" | "B" | "C" | "D" | "E" | "H" | "L" | "F"
export type Register16Name = "HL" | "PC" | "SP" | "BC" | "DE" | "AF"
export type FlagName = "Zero" | "Operation" | "Half-Carry" | "Carry"

// M = memory at address (HL), N = immediate next byte
export type ByteDestinationName =
  | Register8Name
  | "M"
  | "(FF,N)"
  | "(FF,C)"
  | "(BC)"
  | "(DE)"
  | "(NN)"
export type ByteSourceName = ByteDestinationName | "N"

export type Target8Name = "A" | "B" | "C" | "D" | "E" | "H" | "L" | "M"
export type AluOperation =
  | "add"
  | "adc"
  | "sub"
  | "sbc"
  | "and"
  | "xor"
  | "or"
  | "cp"
export type JumpCondition = "Not-Zero" | "Zero" | "Not-Carry" | "Carry" | "None"

export type Interrupt = "VBlank" | "LCD" | "Timer" | "Serial" | "Joypad"
