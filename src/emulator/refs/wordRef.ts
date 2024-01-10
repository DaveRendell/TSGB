import { ByteRef } from "./byteRef"

export interface WordRef {
  value: number
}

export class GenericWordRef implements WordRef {
  private _value: number

  constructor(value: number = 0) {
    this._value = value & 0xffff
  }

  get value() {
    return this._value
  }

  set value(value: number) {
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

  get value() {
    return (this.high.value << 8) + this.low.value
  }

  set value(value: number) {
    this.high.value = value >> 8
    this.low.value = value & 0xff
  }
}
