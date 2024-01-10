import { WaveChannelRegisters } from "../memory/registers/audioRegisters"
import { Channel } from "./channel"
import { LengthTimer } from "./lengthTimer"

interface Props {
  audioContext: AudioContext
  outputNode: AudioNode
  registers: WaveChannelRegisters
}

const SAMPLE_RATE = 65536

export default class WaveChannel implements Channel {
  registers: WaveChannelRegisters
  audioContext: AudioContext

  playing = false
  period = 0

  buffer: AudioBuffer
  bufferSource: AudioBufferSourceNode
  gain: GainNode

  // These two nodes are used by the debug UI to display waveforms / mute
  // the channel
  analyser: AnalyserNode
  muteNode: GainNode

  timer: LengthTimer

  waveFormChanged: () => void = () => {}

  constructor({ audioContext, outputNode, registers }: Props) {
    this.registers = registers
    registers.channel = this
    this.audioContext = audioContext

    this.buffer = audioContext.createBuffer(1, 32, 65536)
    this.bufferSource = audioContext.createBufferSource()

    this.gain = audioContext.createGain()
    this.gain.gain.value = 0

    this.analyser = audioContext.createAnalyser()
    this.muteNode = audioContext.createGain()
    this.muteNode.gain.value = 1

    this.bufferSource.buffer = this.buffer
    this.bufferSource.loop = true

    this.bufferSource.connect(this.gain)
    this.gain.connect(this.muteNode)
    this.muteNode.connect(this.analyser)
    this.analyser.connect(outputNode)

    this.bufferSource.start()

    this.timer = new LengthTimer(() => this.stop())
  }

  update(cycles: number) {
    if (this.playing) {
      this.timer.update(cycles)
    }
  }

  start() {
    this.bufferSource.stop()
    this.playing = true

    const sampleRate = 2097152 / (2048 - this.registers.period)
    const buffer = this.audioContext.createBuffer(
      1,
      32,
      this.audioContext.sampleRate,
    )
    buffer.copyToChannel(this.registers.samples, 0, 0)
    const bufferSource = this.audioContext.createBufferSource()
    bufferSource.buffer = buffer
    bufferSource.loop = true
    bufferSource.playbackRate.value = sampleRate / this.audioContext.sampleRate

    bufferSource.connect(this.gain)
    bufferSource.start()
    this.bufferSource = bufferSource

    this.setVolume(this.registers.volumeSetting)
    this.timer.resetClock()
  }

  stop() {
    this.playing = false
    this.setVolume(0)
    this.bufferSource.stop()
    this.waveFormChanged()
  }

  setVolume(volumeSetting: number) {
    this.gain.gain.setValueAtTime(
      [0, 1, 0.5, 0.25][volumeSetting] * (15 / 100),
      this.audioContext.currentTime,
    )
    this.waveFormChanged()
  }
}
