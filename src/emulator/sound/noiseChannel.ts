import { NoiseChannelRegisters } from "../memory/registers/audioRegisters";
import { Channel } from "./channel";
import { LengthTimer } from "./lengthTimer";
import { VolumeEnvelope } from "./volumeEnvelope";

/**
 * NOT YET IMPLEMENTED PROPERLY...
 */

interface Props {
  audioContext: AudioContext
  outputNode: AudioNode
  registers: NoiseChannelRegisters
}

const SAMPLE_LENGTH = 2 << 16
const SAMPLE_DEPTH = 64

export class NoiseChannel implements Channel {
  audioContext: AudioContext

  playing = false
  volume = 0
  mode = 0
  playRate = 0

  longBuffer: AudioBuffer
  shortBuffer: AudioBuffer
  bufferSource: AudioBufferSourceNode
  gain: GainNode

  analyser: AnalyserNode;
  muteNode: GainNode;

  timer: LengthTimer
  envelope: VolumeEnvelope

  waveFormChanged: () => void;

  constructor({ audioContext, outputNode, registers }: Props) {
    registers.channel = this

    this.audioContext = audioContext

    this.longBuffer = audioContext.createBuffer(1, SAMPLE_LENGTH, audioContext.sampleRate)
    this.shortBuffer = audioContext.createBuffer(1, SAMPLE_LENGTH, audioContext.sampleRate)

    this.longBuffer.copyToChannel(createBuffer15(), 0)
    this.shortBuffer.copyToChannel(createBuffer7(), 0)

    this.gain = audioContext.createGain()
    this.gain.gain.value = 0

    this.analyser = audioContext.createAnalyser()
    this.muteNode = audioContext.createGain()
    this.muteNode.gain.value = 1

    this.gain.connect(this.muteNode)
    this.muteNode.connect(this.analyser)
    this.analyser.connect(outputNode)

    this.createBufferSource()
    this.setSampleRate(0.5, 0)

    this.waveFormChanged = () => {}

    this.timer = new LengthTimer(() => this.stop())
    this.envelope = new VolumeEnvelope((increment) => this.updateVolume(increment))
    this.setMode(0)
  }

  update(cycles: number): void {
    if (this.playing) {
      this.timer.update(cycles)
      this.envelope.update(cycles)
    }
  }

  start() {
    this.createBufferSource()
    this.playing = true
    this.bufferSource.start()
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
    console.log(`Noise volume envelope changing volume by ${increment} to ${this.volume}`)
  }

  setMode(mode: number) {
    this.mode = mode
  }

  setSampleRate(divider: number, shift: number) {
    const bitFreq = 262144 / (divider * (1 << shift))
    this.playRate = SAMPLE_DEPTH * bitFreq / this.audioContext.sampleRate
    console.log("Setting sample rate", { divider, shift, playRate: this.playRate })
    this.bufferSource.playbackRate.setValueAtTime(this.playRate, this.audioContext.currentTime)
  }

  createBufferSource() {
    if (this.playing) {
      this.bufferSource.stop()
    }
    this.bufferSource = this.audioContext.createBufferSource()
    this.bufferSource.playbackRate.value = this.playRate
    if (this.mode == 0) { this.bufferSource.buffer = this.longBuffer }
    else { this.bufferSource.buffer = this.shortBuffer }
    this.bufferSource.connect(this.gain)
    this.bufferSource.loop = true
  }

  setVolume(volume: number = this.volume) {
    this.volume = volume < 0 ? 0 : volume > 15 ? 15 : volume
    this.gain.gain.setValueAtTime(this.volume / 200, this.audioContext.currentTime)
    this.waveFormChanged()
  }
}

function createBuffer7(): Float32Array {
  const values = new Float32Array(SAMPLE_DEPTH * SAMPLE_LENGTH)
  let lsfr = 0
  for (let i = 0; i < SAMPLE_LENGTH; i++) {
    let shift = lsfr >> 1
    const b0 = lsfr & 1
    const b1 = shift & 1
    const carry = 1 - (b0 ^ b1)
    shift &= 0b01111111
    shift |= (carry << 7)
    lsfr = shift
    const value = carry ? 1 : -1
    for (let j = 0; j < SAMPLE_DEPTH; j++) {
      values[i * SAMPLE_DEPTH + j] = value
    }
  }
  return values
}

function createBuffer15(): Float32Array {
  const values = new Float32Array(SAMPLE_DEPTH * SAMPLE_LENGTH)
  let lsfr = 0
  for (let i = 0; i < SAMPLE_LENGTH; i++) {
    let shift = lsfr >> 1
    const b0 = lsfr & 1
    const b1 = shift & 1
    const carry = 1 - (b0 ^ b1)
    shift &= 0b0111111111111111
    shift |= (carry << 15)
    lsfr = shift
    const value = carry ? 1 : -1
    for (let j = 0; j < SAMPLE_DEPTH; j++) {
      values[i * SAMPLE_DEPTH + j] = value
    }
  }
  return values
}