import { Target8Name, MutableValue } from "../../types";
import CPU from "../cpu";

export const getValue = (name: Target8Name, cpu: CPU): MutableValue<8> =>
  name === "M"
    ? cpu.memory.at(cpu.registers.get16("HL").read())
    : cpu.registers.get8(name)

export const to2sComplement = (input: number) =>
  input < 0x00 ? input + 0x100 : input
export const from2sComplement = (input: number) =>
  input > 0x7F ? input - 0x100 : input