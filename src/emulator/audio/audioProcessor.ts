import CPU from "../cpu/cpu"
import Memory from "../memory/memoryMap"
import { SpeedSwitchRegister } from "../memory/registers/speedSwitchRegister"
import { NoiseChannel } from "./noiseChannel"
import PulseChannel from "./pulseChannel"
import WaveChannel from "./waveChannel"

// Reference: https://gbdev.io/pandocs/Audio_Registers.html
export default class AudioProcessor {
  cpu: CPU
  memory: Memory
  audioContext: AudioContext = new AudioContext({ sampleRate: 44100 })

  masterVolume: number = 0
  vinVolume: GainNode
  masterControl: GainNode

  channel1: PulseChannel
  channel2: PulseChannel
  channel3: WaveChannel
  channel4: NoiseChannel

  speedSwitchRegister: SpeedSwitchRegister

  constructor(cpu: CPU) {
    this.cpu = cpu
    this.memory = cpu.memory
    this.memory.registers.audioMasterControl.audioProcessor = this
    this.memory.registers.masterVolumeVin.updateVolume = (volume) => {
      if (this.masterVolume !== volume) {
        this.masterVolume = volume
        this.vinVolume.gain.setValueAtTime(
          volume / 8,
          this.audioContext.currentTime,
        )
        // console.log(volume, this.vinVolume.gain.value)
      }
    }
    this.speedSwitchRegister = this.memory.registers.speedSwitch
    cpu.audioProcessor = this
    cpu.addClockCallback(this)
    this.audioContext.suspend()

    this.masterControl = this.audioContext.createGain()
    this.vinVolume = this.audioContext.createGain()

    this.channel1 = new PulseChannel({
      audioContext: this.audioContext,
      outputNode: this.vinVolume,
      registers: this.memory.registers.channel1,
    })
    this.channel2 = new PulseChannel({
      audioContext: this.audioContext,
      outputNode: this.vinVolume,
      registers: this.memory.registers.channel2,
    })
    this.channel3 = new WaveChannel({
      audioContext: this.audioContext,
      outputNode: this.vinVolume,
      registers: this.memory.registers.channel3,
    })
    this.channel4 = new NoiseChannel({
      audioContext: this.audioContext,
      outputNode: this.vinVolume,
      registers: this.memory.registers.channel4,
    })
    this.vinVolume.connect(this.masterControl)
    this.masterControl.connect(this.audioContext.destination)
  }

  updateClock(cycles: number) {
    const adjustedCycles = this.speedSwitchRegister.doubleSpeed ? cycles >> 1 : cycles
    this.channel1.update(adjustedCycles)
    this.channel2.update(adjustedCycles)
    this.channel3.update(adjustedCycles)
    this.channel4.update(adjustedCycles)
  }

  startAudio() {
    this.audioContext.resume()
  }

  stopAudio() {
    this.audioContext.suspend()
  }
}
