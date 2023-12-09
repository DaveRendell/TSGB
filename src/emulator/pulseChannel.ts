import { MutableValue } from "../types"
import APU from "./apu"
import Memory from "./memory"

// Roughly equal to 4.2MHz clock speed / 256Hz 
const LENGTH_TIMER_TICK = 0x4000

// Roughly equal to 4.2MHz clock speed / 64Hz
const ENVELOPER_TIMER_TICK = 0x10000

interface Props {
  apu: APU
  memory: Memory
  periodSweepRegister?: number
  lengthTimerRegister: number
  volumeEnvelopeRegister: number
  periodLowRegister: number
  controlRegister: number
}

export default class PulseChannel {
  apu: APU
  memory: Memory

  periodSweep?: MutableValue<8>
  lengthTimer: MutableValue<8>
  volumeEnvelope: MutableValue<8>
  periodLow: MutableValue<8>
  control: MutableValue<8>

  cache = {
    periodSweep: 0,
    lengthTimer: 0,
    volumeEnvelope: 0,
    periodLow: 0,
    control: 0,
  }

  playing = false
  period = 0

  lengthClock = 0
  lengthEnabled = false
  timer = 0

  envelopeClock = 0
  volume = 0
  envelopeDirection: -1 | 1 = 1
  envelopePace = 0
  envelopeTimer = 0

  oscillator: OscillatorNode
  gain: GainNode

  constructor(props: Props) {
    this.apu = props.apu
    this.memory = props.memory

    this.periodSweep = props.periodSweepRegister
      ? this.memory.atOldQQ(props.periodSweepRegister) : undefined
    this.lengthTimer = this.memory.atOldQQ(props.lengthTimerRegister)
    this.volumeEnvelope = this.memory.atOldQQ(props.volumeEnvelopeRegister)
    this.periodLow = this.memory.atOldQQ(props.periodLowRegister)
    this.control = this.memory.atOldQQ(props.controlRegister)

    this.oscillator = this.apu.audioContext.createOscillator()
    this.oscillator.type = "square"
    this.oscillator.frequency.value = 440
    this.gain = this.apu.audioContext.createGain()
    this.gain.gain.value = 0
    this.oscillator.connect(this.gain)
    this.oscillator.start()
  }

  update(cycles: number) {
    if (this.playing) {
      if (this.lengthEnabled) {
        this.lengthClock += cycles
        if (this.lengthClock > LENGTH_TIMER_TICK) {
          this.lengthClock -= LENGTH_TIMER_TICK
          this.timer--
          if (this.timer <= 0) {
            this.playing = false
            this.setVolume(0)
          }
        }
      }

      if (this.envelopePace) {
        this.envelopeClock += cycles
        if (this.envelopeClock > ENVELOPER_TIMER_TICK) {
          this.envelopeClock -= ENVELOPER_TIMER_TICK
          this.envelopeTimer--
          if (this.envelopeTimer <= 0) {
            this.envelopeTimer = this.envelopePace
            this.setVolume(this.volume + this.envelopeDirection)
          }
        }
      }
    }    
    
    const lengthByte = this.lengthTimer.read()
    if (lengthByte !== this.cache.lengthTimer) {
      this.cache.lengthTimer = lengthByte
      // TODO Duty Cycles
      this.timer = lengthByte & 0x3F
    }

    const volumeByte = this.volumeEnvelope.read()
    if (volumeByte !== this.cache.volumeEnvelope) {
      this.cache.volumeEnvelope = volumeByte
      this.envelopeDirection = (volumeByte & 0x08) ? 1 : -1
      this.setVolume(volumeByte >> 4)
      this.envelopePace = volumeByte & 0x07
      this.envelopeTimer = this.envelopePace
    }

    const periodByte = this.periodLow.read()
    if (periodByte !== this.cache.periodLow) {
      this.cache.periodLow = periodByte
      this.setPeriod((this.period & 0xF00) | (periodByte))
    }

    const controlByte = this.control.read()
    if (controlByte !== this.cache.control) {
      this.cache.control = controlByte
      // Set upper 3 bits of period using the lowest 3 bits of register
      this.setPeriod((this.period & 0x0FF) | ((controlByte & 0b111) << 8))
      this.lengthEnabled = !!(controlByte & 0x40)
      if (!this.playing && (controlByte & 0x80)) {
        // Start playing channel
        this.playing = true
        this.gain.connect(this.apu.audioContext.destination)
        this.setVolume()
        this.lengthClock = 0
        this.envelopeClock = 0
      }
    }
  }

  setPeriod(period: number) {
    this.period = period
    const frequency = 131072 / (2048 - period)
    this.oscillator.frequency.setValueAtTime(
      frequency, this.apu.audioContext.currentTime)
  }

  setVolume(volume: number = this.volume) {
    this.volume = volume < 0 ? 0 : volume > 15 ? 15 : volume
    this.gain.gain.setValueAtTime(this.volume / 100, this.apu.audioContext.currentTime)
  }

}