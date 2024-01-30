import { MessageType } from "../graphics/message"

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

/**
 * Wrapper for a byte reference that should have writes forwarded to the 
 * renderer worker. Used for memory that is required for rendering the screen,
 * i.e. VRAM, OAM, and certain IO registers.
 */
export class ForwardedByteRef implements ByteRef {
  address: number
  inner: ByteRef
  worker: Worker

  constructor(address: number, inner: ByteRef, worker: Worker) {
    this.address = address
    this.inner = inner
    this.worker = worker
  }

  get byte(): number {
    return this.inner.byte
  }

  set byte(value: number) {
    this.worker.postMessage({
      type: MessageType.MemoryWrite, address: this.address, value
    })
    this.inner.byte = value
  }
}
