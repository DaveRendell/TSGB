import { PulseChannelRegisters } from "../memory/registers/audioRegisters"
import { Channel } from "./channel"
import { LengthTimer } from "./lengthTimer"
import { PeriodSweep } from "./periodSweep"
import { VolumeEnvelope } from "./volumeEnvelope"

interface Props {
  audioContext: AudioContext
  outputNode: AudioNode
  registers: PulseChannelRegisters
}

/**
 * Pulse audio channel that produces square waves. Used for channels 1 and 2
 */
export default class PulseChannel implements Channel {
  audioContext: AudioContext

  playing = false
  period = 0
  volume = 0

  oscillator: OscillatorNode
  gain: GainNode

  // These two nodes are used by the debug UI to display waveforms / mute
  // the channel
  analyser: AnalyserNode
  muteNode: GainNode

  timer: LengthTimer
  envelope: VolumeEnvelope
  sweep: PeriodSweep

  waveFormChanged: () => void = () => {}

  constructor({ audioContext, outputNode, registers }: Props) {
    this.audioContext = audioContext

    this.oscillator = audioContext.createOscillator()
    this.oscillator.type = "square"
    this.oscillator.frequency.value = 440

    this.gain = audioContext.createGain()
    this.gain.gain.value = 0

    this.analyser = audioContext.createAnalyser()
    this.muteNode = audioContext.createGain()
    this.muteNode.gain.value = 1

    this.oscillator.connect(this.muteNode)
    this.muteNode.connect(this.gain)
    this.gain.connect(this.analyser)
    this.analyser.connect(outputNode)

    this.oscillator.start()

    this.timer = new LengthTimer(() => this.stop())
    this.envelope = new VolumeEnvelope((increment) =>
      this.updateVolume(increment),
    )
    this.sweep = new PeriodSweep((step, direction) =>
      this.updatePeriod(step, direction),
    )

    registers.channel = this
  }

  update(cycles: number) {
    if (this.playing) {
      this.timer.update(cycles)
      this.envelope.update(cycles)
      this.sweep.update(cycles)
    }
  }

  start() {
    this.playing = true
    this.setVolume()
    this.timer.resetClock()
    this.envelope.resetClock()
  }

  stop() {
    this.playing = false
    this.setVolume(0)
  }

  updateVolume(increment: number) {
    this.setVolume(this.volume + increment)
  }

  updatePeriod(step: number, direction: 1 | -1) {
    const newPeriod = this.period + direction * (this.period / (1 << step))
    this.setPeriod(newPeriod)
  }

  setPeriod(period: number) {
    this.period = period
    const frequency = 131072 / (2048 - period)
    this.oscillator.frequency.setValueAtTime(
      frequency,
      this.audioContext.currentTime,
    )
    this.waveFormChanged()
  }

  setVolume(volume: number = this.volume) {
    this.volume = volume < 0 ? 0 : volume > 15 ? 15 : volume
    this.gain.gain.setValueAtTime(
      this.volume / 100,
      this.audioContext.currentTime,
    )
    this.waveFormChanged()
  }
}
