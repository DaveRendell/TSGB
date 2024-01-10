export interface ByteRef {
  byte: number
}

export class GenericByteRef implements ByteRef {
  private _value: number

  constructor(value: number = 0) {
    this._value = value & 0xff
  }

  get byte() {
    return this._value
  }
  set byte(value: number) {
    this._value = value & 0xff
  }
}

export class ConstantByteRef implements ByteRef {
  private _value: number
  constructor(value: number = 0) {
    this._value = value
  }
  get byte() {
    return this._value
  }
  set byte(value: number) {}
}

export class GetSetByteRef implements ByteRef {
  getter: () => number
  setter: (value: number) => void

  constructor(getter: () => number, setter: (value: number) => void) {
    this.getter = getter
    this.setter = setter
  }

  get byte(): number {
    return this.getter()
  }
  set byte(value: number) {
    this.setter(value)
  }
}
