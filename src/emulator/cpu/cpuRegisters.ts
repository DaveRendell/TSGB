import { ByteRef, GenericByteRef } from "../refs/byteRef"
import { WordRef, GenericWordRef, CompositeWordRef } from "../refs/wordRef"
import { Flags } from "./flags"

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
}
