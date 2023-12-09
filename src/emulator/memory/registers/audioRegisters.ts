// Reference:
// https://gbdev.io/pandocs/Audio_Registers.html#audio-registers

import { ByteRef } from "../../refs/byteRef";

export class AudioMasterControlRegister implements ByteRef {
  masterSwitch = false
  channel1On = false
  channel2On = false
  channel3On = false
  channel4On = false

  get value(): number {
    return (this.masterSwitch ? 0x80 : 0)
         + (this.channel4On ? 0x8 : 0)
         + (this.channel3On ? 0x4 : 0)
         + (this.channel2On ? 0x2 : 0)
         + (this.channel1On ? 0x1 : 0)
  }

  set value(value: number) {
    this.masterSwitch = (value & 0x80) > 0
    this.channel1On = (value & 0x1) > 0
    this.channel2On = (value & 0x2) > 0
    this.channel3On = (value & 0x4) > 0
    this.channel4On = (value & 0x8) > 0
  }
}

interface PeriodSweepData {
  pace: number
  direction: 1 | -1
  step: number
}

interface VolumeEnvelopeData {
  initialVolume: number
  direction: 1 | -1
  pace: number
}

export class PulseChannelRegisters {
  periodSweep: PeriodSweepData = {
    pace: 0,
    direction: 1,
    step: 0,
  }
  waveDuty = 0
  lengthEnabled = false
  lengthTimer = 0
  volumeEnvelope: VolumeEnvelopeData = {
    initialVolume: 0,
    direction: 1,
    pace: 0,
  }
  period = 0
  trigger: () => void = () => {}

  nr0: ByteRef
  nr1: ByteRef
  nr2: ByteRef
  nr3: ByteRef
  nr4: ByteRef

  constructor() {
    const self = this

    this.nr0 = {
      get value(): number {
        return (self.periodSweep.pace << 4)
             + (self.periodSweep.step)
             + (self.periodSweep.direction == -1 ? 0x8 : 0)
      },
      set value(value: number) {
        self.periodSweep.pace = value >> 4
        self.periodSweep.step = value & 0x7
        self.periodSweep.direction = (value & 0x8) > 0 ? -1 : 1 
      }
    }

    this.nr1 = {
      get value(): number {
        return (self.waveDuty << 6) + self.lengthTimer
      },
      set value(value: number) {
        self.waveDuty = value >> 6
        self.lengthTimer = value & 0x37
      }
    }

    this.nr2 = {
      get value(): number {
        return (self.volumeEnvelope.initialVolume << 4)
          + (self.volumeEnvelope.pace)
          + (self.volumeEnvelope.direction == -1 ? 0x8 : 0)
      },
      set value(value: number) {
        self.volumeEnvelope.initialVolume = value >> 4
        self.volumeEnvelope.pace = value & 0x7
        self.volumeEnvelope.direction = (value & 0x8) > 0 ? -1 : 1 
      }
    }
    
    this.nr3 = {
      get value(): number { return 0 }, // Write only
      set value(value: number) {
        self.period &= 0xF00
        self.period |= value
      }
    }

    this.nr4 = {
      get value(): number { return self.lengthEnabled ? 0x40 : 0 },
      set value(value: number) {
        self.period &= 0xF00
        self.period |= (value & 0x7) << 8

        self.lengthEnabled = (value & 0x40) > 0

        if (value & 0x80) { self.trigger() }
      }
    }
  }
}