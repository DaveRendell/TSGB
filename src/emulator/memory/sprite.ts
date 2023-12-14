import { ByteRef, GetSetByteRef } from "../refs/byteRef"

// Reference: https://gbdev.io/pandocs/OAM.html#object-attribute-memory-oam
export class Sprite {
  x = 0
  y = 0
  tile = 0
  priority = false
  flipY = false
  flipX = false
  pallette = 0

  bytes: ByteRef[]

  constructor() {
    const bytes: ByteRef[] = []
    bytes.push(new GetSetByteRef( // 0: Y Position
      () => this.y,
      (value) => this.y = value
    ))
    bytes.push(new GetSetByteRef( // 1: X Position
      () => this.x,
      (value) => this.x = value
    ))
    bytes.push(new GetSetByteRef( // 2: Tile index
      () => this.tile,
      (value) => this.tile = value
    ))
    bytes.push(new GetSetByteRef( // 3: Attributes / Flags
      () => (this.priority ? 0x80 : 0)
          + (this.flipY ? 0x40 : 0)
          + (this.flipX ? 0x20 : 0)
          + (this.pallette << 4),
      (value) => {
        this.priority = (value & 0x80) > 0
        this.flipY = (value & 0x40) > 0
        this.flipX = (value & 0x20) > 0
        this.pallette = (value & 0x10) >> 4
      }
    ))
    this.bytes = bytes
  }
}