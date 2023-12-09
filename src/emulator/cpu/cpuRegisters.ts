import { ByteRef, GenericByteRef } from "../refs/byteRef"
import { WordRef, GenericWordRef, CompositeWordRef } from "../refs/wordRef"
import { Flags } from "./flags"

export enum ByteRegister {
  A, F, B, C, D, E, H, L
}

export enum WordRegister {
  PC, SP, HL, AF, BC, DE
}

export class CpuRegisters {
  A: ByteRef
  F: Flags
  B: ByteRef
  C: ByteRef
  D: ByteRef
  E: ByteRef
  H: ByteRef
  L: ByteRef

  PC: WordRef
  SP: WordRef
  HL: WordRef
  BC: WordRef
  DE: WordRef
  AF: WordRef
  
  constructor() {
      this.A = new GenericByteRef()
      this.F = new Flags()
      this.B = new GenericByteRef()
      this.C = new GenericByteRef()
      this.D = new GenericByteRef()
      this.E = new GenericByteRef()
      this.H = new GenericByteRef()
      this.L = new GenericByteRef()

      this.PC = new GenericWordRef()
      this.SP = new GenericWordRef()
      this.HL = new CompositeWordRef(this.H, this.L)
      this.BC = new CompositeWordRef(this.B, this.C)
      this.DE = new CompositeWordRef(this.D, this.E)
      this.AF = new CompositeWordRef(this.A, this.F)
  }

  getByteRegister(register: ByteRegister): ByteRef {
      switch(register) {
          case ByteRegister.A: return this.A
          case ByteRegister.F: return this.F
          case ByteRegister.B: return this.B
          case ByteRegister.C: return this.C
          case ByteRegister.D: return this.D
          case ByteRegister.E: return this.E
          case ByteRegister.H: return this.H
          case ByteRegister.L: return this.L
      }
  }

  getWordRegister(register: WordRegister): WordRef {
      switch(register) {
          case WordRegister.PC: return this.PC
          case WordRegister.SP: return this.SP
          case WordRegister.HL: return this.HL
          case WordRegister.BC: return this.BC
          case WordRegister.DE: return this.DE
          case WordRegister.AF: return this.AF
      }
  }
}
