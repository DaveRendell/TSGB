import { NoiseChannelRegisters } from "../memory/registers/audioRegisters"
import { Channel } from "./channel"
import { LengthTimer } from "./lengthTimer"
import { VolumeEnvelope } from "./volumeEnvelope"

/**
 * NOT YET IMPLEMENTED PROPERLY...
 */

interface Props {
  audioContext: AudioContext
  outputNode: AudioNode
  registers: NoiseChannelRegisters
}

const SAMPLE_LENGTH = 2 << 17
const SAMPLE_DEPTH = 64

export class NoiseChannel implements Channel {
  audioContext: AudioContext

  playing = false
  volume = 0
  mode = 0
  playRate = 0

  sourceA: AudioBufferSourceNode
  sourceB: AudioBufferSourceNode

  gain: GainNode

  analyser: AnalyserNode
  muteNode: GainNode

  timer: LengthTimer
  envelope: VolumeEnvelope

  lsfr = (1 << 7) - 1

  waveFormChanged: () => void

  constructor({ audioContext, outputNode, registers }: Props) {
    registers.channel = this

    this.audioContext = audioContext

    this.gain = audioContext.createGain()
    this.gain.gain.value = 0

    this.analyser = audioContext.createAnalyser()
    this.muteNode = audioContext.createGain()
    this.muteNode.gain.value = 1

    this.gain.connect(this.muteNode)
    this.muteNode.connect(this.analyser)
    this.analyser.connect(outputNode)

    this.sourceA = this.audioContext.createBufferSource()
    this.sourceB = this.audioContext.createBufferSource()

    this.setSampleRate(0.5, 0)

    this.waveFormChanged = () => {}

    this.timer = new LengthTimer(() => this.stop())
    this.envelope = new VolumeEnvelope((increment) =>
      this.updateVolume(increment),
    )
    this.setMode(0)
  }

  update(cycles: number): void {
    if (this.playing) {
      this.timer.update(cycles)
      this.envelope.update(cycles)
    }
  }

  start() {
    this.playing = true
    this.lsfr = (1 << 7) - 1
    this.createSourceA()
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

  setMode(mode: number) {
    this.mode = mode
  }

  setSampleRate(divider: number, shift: number) {
    const bitFreq = 262144 / (divider * (1 << shift))
    this.playRate = (SAMPLE_DEPTH * bitFreq) / this.audioContext.sampleRate
    this.sourceA.playbackRate.setValueAtTime(
      this.playRate,
      this.audioContext.currentTime,
    )
    this.sourceB.playbackRate.setValueAtTime(
      this.playRate,
      this.audioContext.currentTime,
    )
  }

  setVolume(volume: number = this.volume) {
    this.volume = volume < 0 ? 0 : volume > 15 ? 15 : volume
    this.gain.gain.setValueAtTime(
      this.volume / 100,
      this.audioContext.currentTime,
    )
    this.waveFormChanged()
  }

  generateLSFR(width: number): Float32Array {
    const period = 1 << (width - 1)
    const output = new Float32Array(period * SAMPLE_DEPTH)
  
    for (let i = 0; i < period; i++) {
      let bit = (this.lsfr ^ (this.lsfr >> 1)) & 1
      this.lsfr = (this.lsfr >> 1) | (bit << (width - 1))
      for (let j = 0; j < SAMPLE_DEPTH; j++) {
        output[SAMPLE_DEPTH * i + j] = bit * 2 - 1
      }
    }
  
    return output
  }

  createSourceA() {
    if (this.playing) {
      this.sourceA = this.createSource()
      this.sourceA.onended = this.createSourceB
      this.sourceA.start()
    }
  }

  createSourceB() {
    if (this.playing) {
      this.sourceB = this.createSource()
      this.sourceB.onended = this.createSourceA
      this.sourceB.start()
    }
  }

  createSource() {
    const source = this.audioContext.createBufferSource()
    source.playbackRate.value = this.playRate
    const buffer = this.audioContext.createBuffer(
      1,
      SAMPLE_LENGTH,
      this.audioContext.sampleRate
    )
    buffer.copyToChannel(this.generateLSFR(this.mode == 0 ? 15 : 7), 0)
    source.buffer = buffer
    source.connect(this.gain)
    source.loop = false
    return source
  }
}