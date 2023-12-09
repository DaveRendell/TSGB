// Reference: https://gbdev.io/pandocs/Interrupts.html

import { ByteRef } from "../../refs/byteRef";

export enum Interrupt {
  VBlank,
  LCD,
  Timer,
  Serial,
  Joypad,
}

export class InterruptRegister implements ByteRef {
  private requested: Record<Interrupt, boolean>
    = [false, false, false, false, false]

  get value(): number {
    return (this.requested[Interrupt.Joypad] ? 0x10 : 0)
         + (this.requested[Interrupt.Serial] ? 0x8 : 0)
         + (this.requested[Interrupt.Timer] ? 0x4 : 0)
         + (this.requested[Interrupt.LCD] ? 0x2 : 0)
         + (this.requested[Interrupt.VBlank] ? 0x1 : 0)
  }

  set value(value: number) {
    this.requested[Interrupt.Joypad] = (value & 0x10) > 0
    this.requested[Interrupt.Serial] = (value & 0x8) > 0
    this.requested[Interrupt.Timer] = (value & 0x4) > 0
    this.requested[Interrupt.LCD] = (value & 0x2) > 0
    this.requested[Interrupt.VBlank] = (value & 0x1) > 0
  }

  setInterrupt(interrupt: Interrupt) {
    this.requested[interrupt] = true
  }

  resetInterrupt(interrupt: Interrupt) {
    this.requested[interrupt] = false
  }
}

export class InterruptEnabledRegister implements ByteRef {
  private enabled: Record<Interrupt, boolean>
    = [false, false, false, false, false]

  get value(): number {
    return (this.enabled[Interrupt.Joypad] ? 0x10 : 0)
         + (this.enabled[Interrupt.Serial] ? 0x8 : 0)
         + (this.enabled[Interrupt.Timer] ? 0x4 : 0)
         + (this.enabled[Interrupt.LCD] ? 0x2 : 0)
         + (this.enabled[Interrupt.VBlank] ? 0x1 : 0)
  }

  set value(value: number) {
    this.enabled[Interrupt.Joypad] = (value & 0x10) > 0
    this.enabled[Interrupt.Serial] = (value & 0x8) > 0
    this.enabled[Interrupt.Timer] = (value & 0x4) > 0
    this.enabled[Interrupt.LCD] = (value & 0x2) > 0
    this.enabled[Interrupt.VBlank] = (value & 0x1) > 0
  }

  isEnabled(interrupt: Interrupt): boolean {
    return this.enabled[interrupt]
  }
}