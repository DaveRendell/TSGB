import { Target8Name, MutableValue, Register16Name } from "../../types";
import CPU from "../cpu";

export const getValue = (name: Target8Name, cpu: CPU): MutableValue<8> =>
  name === "M"
    ? cpu.memory.at(cpu.registers.get16("HL").read())
    : cpu.registers.get8(name)

export const get16BitRegister = (name: Register16Name, cpu: CPU): MutableValue<16> =>
  cpu.registers.get16(name)

export const to2sComplement = (input: number) =>
  input < 0x00 ? input + 0x100 : input

export const from2sComplement = (input: number) =>
  input > 0x7F ? input - 0x100 : input

export const combineBytes = (high: number, low: number) =>
  (high << 8) + low

export const splitBytes = (input: number) =>
  [input & 0xFF00, input & 0x00FF]