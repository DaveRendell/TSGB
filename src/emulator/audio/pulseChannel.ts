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

const SAMPLE_DEPTH = 1024

const DUTY_CYCLES = [
  [1,1,1,1,1,1,1,0],
  [0,1,1,1,1,1,1,0],
  [0,1,1,1,1,0,0,0],
  [1,0,0,0,0,0,0,1],
]

/**
 * Pulse audio channel that produces square waves. Used for channels 1 and 2
 */
export default class PulseChannel implements Channel {
  audioContext: AudioContext

  playing = false
  period = 0
  volume = 0

  currentCycle: number = 0
  bufferSource: AudioBufferSourceNode
  bufferSources: AudioBufferSourceNode[]
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


    this.gain = audioContext.createGain()
    this.gain.gain.value = 0

    this.analyser = audioContext.createAnalyser()
    this.muteNode = audioContext.createGain()
    this.muteNode.gain.value = 1

    
    this.muteNode.connect(this.gain)
    this.gain.connect(this.analyser)
    this.analyser.connect(outputNode)

    this.bufferSources = DUTY_CYCLES.map(dutyCycle => {
      const buffer = this.audioContext.createBuffer(1, SAMPLE_DEPTH << 3, this.audioContext.sampleRate)
      buffer.copyToChannel(generateBuffer(dutyCycle), 0)
      const bufferSource = this.audioContext.createBufferSource()
      bufferSource.buffer = buffer
      bufferSource.loop = true

      bufferSource.start()
      return bufferSource
    })
    this.bufferSource = this.bufferSources[this.currentCycle]
    this.bufferSource.connect(this.muteNode)

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
    const sampleRate = (1048576 * SAMPLE_DEPTH) / (2048 - period)
    this.bufferSource.playbackRate.setValueAtTime(
      sampleRate / this.audioContext.sampleRate,
      this.audioContext.currentTime
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

  setDutyCycle(cycleId: number) {
    if (cycleId == this.currentCycle) { return }
    this.bufferSource.disconnect()
    this.currentCycle = cycleId
    this.bufferSource = this.bufferSources[this.currentCycle]
    this.bufferSource.connect(this.muteNode)
  }
}

function generateBuffer(dutyCycle: number[]): Float32Array {
  const output = new Float32Array(8 * SAMPLE_DEPTH)
  for (let i = 0; i < 8; i++) {
    const bit = dutyCycle[i]
    for (let j = 0; j < SAMPLE_DEPTH; j++) {
      output[SAMPLE_DEPTH * i + j] = (bit << 1) - 1
    }
  }
  return output
}
