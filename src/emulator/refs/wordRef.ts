import { ByteRef } from "./byteRef"

export interface WordRef {
  word: number
}

export class GenericWordRef implements WordRef {
  private _value: number

  constructor(value: number = 0) {
    this._value = value & 0xffff
  }

  get word() {
    return this._value
  }

  set word(value: number) {
    this._value = value & 0xffff
  }
}

export class CompositeWordRef implements WordRef {
  private high: ByteRef
  private low: ByteRef

  constructor(high: ByteRef, low: ByteRef) {
    this.high = high
    this.low = low
  }

  get word() {
    return (this.high.byte << 8) + this.low.byte
  }

  set word(value: number) {
    this.high.byte = value >> 8
    this.low.byte = value & 0xff
  }
}
