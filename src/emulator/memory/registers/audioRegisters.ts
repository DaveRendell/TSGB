// Reference:
// https://gbdev.io/pandocs/Audio_Registers.html#audio-registers

import APU from "../../apu";
import { ByteRef, GetSetByteRef } from "../../refs/byteRef";
import { NoiseChannel } from "../../sound/noiseChannel";
import PulseChannel from "../../sound/pulseChannel";
import WaveChannel from "../../sound/waveChannel";

export class AudioMasterControlRegister implements ByteRef {
  masterSwitch = false
  channel1On = false
  channel2On = false
  channel3On = false
  channel4On = false
  apu: APU

  get value(): number {
    return (this.masterSwitch ? 0x80 : 0)
         + (this.channel4On ? 0x8 : 0)
         + (this.channel3On ? 0x4 : 0)
         + (this.channel2On ? 0x2 : 0)
         + (this.channel1On ? 0x1 : 0)
  }

  set value(value: number) {
    this.masterSwitch = (value & 0x80) > 0
    if (this.apu) {
      this.apu.masterControl.gain.setValueAtTime(this.masterSwitch ? 1 : 0, this.apu.audioContext.currentTime)
    }
  }
}

interface PeriodSweepData {
  pace: number
  direction: 1 | -1
  step: number
}

interface VolumeEnvelopeData {
  direction: 1 | -1
  pace: number
}

export class PulseChannelRegisters {
  periodSweep: PeriodSweepData = {
    pace: 0,
    direction: -1,
    step: 0,
  }
  waveDuty = 0
  lengthEnabled = false
  lengthTimer = 0
  volumeEnvelope: VolumeEnvelopeData = {
    direction: 1,
    pace: 0,
  }
  period = 0
  volume = 0
  triggered = false
  trigger: () => void = () => {  }

  nr0: ByteRef
  nr1: ByteRef
  nr2: ByteRef
  nr3: ByteRef
  nr4: ByteRef

  channel: PulseChannel

  constructor() {
    const self = this

    this.nr0 = {
      get value(): number {
        return (self.periodSweep.pace << 4)
             + (self.periodSweep.step)
             + (self.periodSweep.direction == 1 ? 0x8 : 0)
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
        if (self.channel) {
          self.channel.timer.setTimer(value & 0x37)
        }
      }
    }

    this.nr2 = {
      get value(): number {
        return (self.volume << 4)
          + (self.volumeEnvelope.pace)
          + (self.volumeEnvelope.direction == 1 ? 0x8 : 0)
      },
      set value(value: number) {
        self.volume = value >> 4
        self.volumeEnvelope.pace = value & 0x7
        self.volumeEnvelope.direction = (value & 0x8) > 0 ? 1 : -1
        if (self.channel) {
          self.channel.setVolume(self.volume)
          self.channel.envelope.setEnvelope(
            self.volumeEnvelope.direction,
            self.volumeEnvelope.pace)
        }
      }
    }
    
    this.nr3 = {
      get value(): number {
        return self.period & 0xFF
      },
      set value(value: number) {
        self.period &= 0xF00
        self.period |= value
        if (self.channel) {
          self.channel.setPeriod(self.period)
        }
      }
    }

    this.nr4 = {
      get value(): number {
        return (self.lengthEnabled ? 0x40 : 0)
          + (self.triggered ? 0x80 : 0)
          + (self.period >> 8)
      },
      set value(value: number) {
        self.period &= 0xFF
        self.period |= (value & 0x7) << 8
        self.lengthEnabled = (value & 0x40) > 0

        if (value & 0x80) {
          self.trigger()
          self.triggered = true
        }

        if (self.channel) {
          self.channel.setPeriod(self.period)
          if (self.lengthEnabled) { self.channel.timer.enable() }
          else { self.channel.timer.disable() }
          if (value & 0x80) {
            self.channel.start()
          }
        }
      }
    }
  }

  updateVolume(newVolume: number) {
    this.volume = newVolume
    if (this.volume < 0) { this.volume = 0 }
    if (this.volume > 15) { this.volume = 15 }
  }
}

export class WaveChannelRegisters {
  enabled = false
  lengthTimer = 0
  lengthEnabled = false
  volumeSetting = 0
  period = 0
  triggered = false
  trigger: () => void = () => {  }
  samples: Float32Array = Float32Array.from(new Array(32).fill(0))

  nr0: ByteRef
  nr1: ByteRef
  nr2: ByteRef
  nr3: ByteRef
  nr4: ByteRef

  channel: WaveChannel

  constructor() {
    const self = this

    this.nr0 = {
      get value() {
        return self.enabled ? 0x80 : 0
      },
      set value(value) {
        self.enabled = (value & 0x80) > 0
        if (!self.enabled && self.channel) {
          self.channel.stop()
        }
      }
    }
    this.nr1 = {
      get value() {
        return self.lengthTimer
      },
      set value(value) {
        self.lengthTimer = value
        if (self.channel) {
          self.channel.timer.setTimer(value)
        }
      }
    }
    this.nr2 = {
      get value() {
        return self.volumeSetting << 5
      },
      set value(value) {
        self.volumeSetting = (value >> 5) & 0x3
        self.channel.setVolume(self.volumeSetting)
      }
    },
    this.nr3 = {
      get value(): number {
        return self.period & 0xFF
      },
      set value(value: number) {
        self.period &= 0xF00
        self.period |= value
      }
    }
    this.nr4 = {
      get value(): number {
        return (self.lengthEnabled ? 0x40 : 0)
          + (self.triggered ? 0x80 : 0)
          + (self.period >> 8)
      },
      set value(value: number) {
        self.period &= 0xFF
        self.period |= (value & 0x7) << 8
        self.lengthEnabled = (value & 0x40) > 0

        if (value & 0x80) {
          self.trigger()
          self.triggered = true
        }

        if (self.channel) {
          if (self.lengthEnabled) { self.channel.timer.enable() }
          else { self.channel.timer.disable() }
          if (value & 0x80) {
            self.channel.start()
          }
        }
      }
    }
  }

  sampleByte(id: number): ByteRef {
    const lowIndex = 2 * id
    const highIndex = 2 * id + 1
    return new GetSetByteRef(
      () => {
        return 0
      },
      (value) => {
        this.samples[lowIndex] = (value >> 4) / 8 - 1
        this.samples[highIndex] = (value & 0x0F) / 8 - 1
      }
    )
  }
}

export class NoiseChannelRegisters {
  lengthTimer = 0
  lengthEnabled = false
  volumeEnvelope: VolumeEnvelopeData = {
    direction: 1,
    pace: 0,
  }
  volume = 0
  clockShift = 0
  lfsrMode = 0
  clockDivider = 0

  channel: NoiseChannel
  
  nr1: ByteRef
  nr2: ByteRef
  nr3: ByteRef
  nr4: ByteRef

  constructor() {
    const self = this
    this.nr1 = {
      get value() { return self.lengthTimer },
      set value(value) {
        self.lengthTimer = value & 0x3F
      }
    }
    this.nr2 = {
      get value(): number {
        return (self.volume << 4)
          + (self.volumeEnvelope.pace)
          + (self.volumeEnvelope.direction == 1 ? 0x8 : 0)
      },
      set value(value: number) {
        self.volume = value >> 4
        self.volumeEnvelope.pace = value & 0x7
        self.volumeEnvelope.direction = (value & 0x8) > 0 ? 1 : -1
        if (self.channel) {
          self.channel.setVolume(self.volume)
          self.channel.envelope.setEnvelope(
            self.volumeEnvelope.direction,
            self.volumeEnvelope.pace)
        }
      }
    }
    this.nr3 = {
      get value() {
        return (self.clockShift << 4)
          + (self.lfsrMode << 3)
          + (self.clockDivider)
      },
      set value(value) {
        self.clockShift = (value >> 4) & 0xF
        self.lfsrMode = (value >> 3) & 1
        self.clockDivider = value & 0x7
        if (self.clockDivider == 0) { self.clockDivider = 0.5 }
        if (self.channel) {
          self.channel.setMode(self.lfsrMode)
          self.channel.setSampleRate(self.clockDivider, self.clockShift)
        }
      }
    }
    this.nr4 = {
      get value(): number {
        return (self.lengthEnabled ? 0x40 : 0)
      },
      set value(value: number) {
        self.lengthEnabled = (value & 0x40) > 0

        if (self.channel) {
          if (self.lengthEnabled) { self.channel.timer.enable() }
          else { self.channel.timer.disable() }
          if (value & 0x80) {
            self.channel.start()
          }
        }
      }
    }
  }
}