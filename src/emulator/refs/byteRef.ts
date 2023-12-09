export interface ByteRef { value: number }

export class GenericByteRef implements ByteRef {
  private _value: number

  constructor(value: number = 0) {
    this._value = value & 0xFF
  }

  get value() { return this._value }
  set value(value: number) { this._value = value & 0xFF }
}

export class ConstantByteRef implements ByteRef {
  private _value: number
  constructor(value: number = 0) { this._value = value }
  get value() { return this._value }
  set value(value: number) {}
}
