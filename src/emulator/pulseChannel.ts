import { MutableValue } from "../types"
import APU from "./apu"
import Memory from "./memory"
import { PulseChannelRegisters } from "./memory/registers/audioRegisters"
import { ByteRef } from "./refs/byteRef"

// Roughly equal to 4.2MHz clock speed / 256Hz 
const LENGTH_TIMER_TICK = 0x4000

// Roughly equal to 4.2MHz clock speed / 64Hz
const ENVELOPER_TIMER_TICK = 0x10000

interface Props {
  apu: APU
  memory: Memory
  registers: PulseChannelRegisters
}

export default class PulseChannel {
  apu: APU
  memory: Memory
  registers: PulseChannelRegisters

  playing = false

  oscillator: OscillatorNode
  gain: GainNode

  volume = 0
  period = 0

  lengthTimer = 0
  lengthClock = 0

  envelopeClock = 0
  envelopeTimer = 0

  constructor(props: Props) {
    this.apu = props.apu
    this.memory = props.memory
    this.registers = this.memory.registers.channel1

    this.oscillator = this.apu.audioContext.createOscillator()
    this.oscillator.type = "square"
    this.oscillator.frequency.value = 440
    this.gain = this.apu.audioContext.createGain()
    this.gain.gain.value = 0
    this.oscillator.connect(this.gain)
    this.oscillator.start()

    this.registers.trigger = () => {
      this.playing = true
      this.gain.connect(this.apu.audioContext.destination)
      this.setVolume()
      this.setPeriod()
      this.lengthClock = 0
      this.envelopeClock = 0
    }
  }

  update(cycles: number) {
    if (this.playing) {
      if (this.registers.lengthEnabled) {
        this.lengthClock += cycles
        if (this.lengthClock > LENGTH_TIMER_TICK) {
          this.lengthClock -= LENGTH_TIMER_TICK
          this.lengthTimer--
          if (this.lengthTimer <= 0) {
            this.playing = false
            this.setVolume(0)
          }
        }
      }

      if (this.registers.volumeEnvelope.pace) {
        this.envelopeClock += cycles
        if (this.envelopeClock > ENVELOPER_TIMER_TICK) {
          this.envelopeClock -= ENVELOPER_TIMER_TICK
          this.envelopeTimer--
          if (this.envelopeTimer <= 0) {
            this.envelopeTimer = this.registers.volumeEnvelope.pace
            this.setVolume(this.volume + this.registers.volumeEnvelope.direction)
          }
        }
      }
    }
  }

  setPeriod() {
    const frequency = 131072 / (2048 - this.registers.period)
    this.oscillator.frequency.setValueAtTime(
      frequency, this.apu.audioContext.currentTime)
  }

  setVolume(volume: number = this.volume) {
    this.volume = volume < 0 ? 0 : volume > 15 ? 15 : volume
    this.gain.gain.setValueAtTime(this.volume / 100, this.apu.audioContext.currentTime)
  }

}