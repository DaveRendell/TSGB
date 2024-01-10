export interface ByteRef {
  value: number
}

export class GenericByteRef implements ByteRef {
  private _value: number

  constructor(value: number = 0) {
    this._value = value & 0xff
  }

  get value() {
    return this._value
  }
  set value(value: number) {
    this._value = value & 0xff
  }
}

export class ConstantByteRef implements ByteRef {
  private _value: number
  constructor(value: number = 0) {
    this._value = value
  }
  get value() {
    return this._value
  }
  set value(value: number) {}
}

export class GetSetByteRef implements ByteRef {
  getter: () => number
  setter: (value: number) => void

  constructor(getter: () => number, setter: (value: number) => void) {
    this.getter = getter
    this.setter = setter
  }

  get value(): number {
    return this.getter()
  }
  set value(value: number) {
    this.setter(value)
  }
}
