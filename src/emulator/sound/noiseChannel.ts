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

const BUFFER_LENGTH = 2048

export class NoiseChannel implements Channel {
  audioContext: AudioContext

  playing = false
  volume = 0

  longBuffer: AudioBuffer
  shortBuffer: AudioBuffer
  longBufferSource: AudioBufferSourceNode
  shortBufferSource: AudioBufferSourceNode
  gain: GainNode

  analyser: AnalyserNode;
  muteNode: GainNode;

  timer: LengthTimer
  envelope: VolumeEnvelope

  waveFormChanged: () => void;

  constructor({ audioContext, outputNode, registers }: Props) {
    registers.channel = this

    this.audioContext = audioContext

    this.longBuffer = audioContext.createBuffer(1, BUFFER_LENGTH, audioContext.sampleRate)
    this.shortBuffer = audioContext.createBuffer(1, BUFFER_LENGTH, audioContext.sampleRate)
    this.longBufferSource = audioContext.createBufferSource()
    this.shortBufferSource = audioContext.createBufferSource()

    this.longBuffer.copyToChannel(generateBuffer(15, BUFFER_LENGTH), 0)
    this.shortBuffer.copyToChannel(generateBuffer(7, BUFFER_LENGTH), 0)
    this.longBufferSource.buffer = this.longBuffer
    this.shortBufferSource.buffer = this.shortBuffer

    this.gain = audioContext.createGain()
    this.gain.gain.value = 0

    this.analyser = audioContext.createAnalyser()
    this.muteNode = audioContext.createGain()
    this.muteNode.gain.value = 1

    this.gain.connect(this.muteNode)
    this.muteNode.connect(this.analyser)
    this.analyser.connect(outputNode)

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

  setMode(mode: number) {
    if (mode == 0) {
      this.shortBufferSource.disconnect()
      this.longBufferSource.connect(this.gain)
    } else {
      this.longBufferSource.disconnect()
      this.shortBufferSource.connect(this.gain)
    }
  }

  setSampleRate(divider: number, shift: number) {
    const playRate = BUFFER_LENGTH * 262144 / (divider * (1 << shift))
    this.longBufferSource.playbackRate.setValueAtTime(playRate, this.audioContext.currentTime)
    this.shortBufferSource.playbackRate.setValueAtTime(playRate, this.audioContext.currentTime)
  }

  setVolume(volume: number = this.volume) {
    this.volume = volume < 0 ? 0 : volume > 15 ? 15 : volume
    this.gain.gain.setValueAtTime(this.volume / 100, this.audioContext.currentTime)
    this.waveFormChanged()
  }
}

function generateBuffer(width: number, length: number): Float32Array {
  const output = new Float32Array()
  let shift = 0
  for (let i = 0; i < length; i++) {
    const bit0 = shift & 1
    shift >>= 1
    const bit1 = shift & 1
    const newBit = bit0 === bit1 ? 1 : 0
    output[i] = bit1
    shift &= ~(1 << width)
    shift |= (newBit << width)
  }
  return output
}