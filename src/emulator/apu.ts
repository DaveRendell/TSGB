import CPU from "./cpu";
import Memory from "./memory";
import { NoiseChannel } from "./sound/noiseChannel";
import PulseChannel from "./sound/pulseChannel";
import WaveChannel from "./sound/waveChannel";

// Reference: https://gbdev.io/pandocs/Audio_Registers.html
export default class APU {
  cpu: CPU
  memory: Memory
  audioContext: AudioContext = new AudioContext({ sampleRate: 44100 });

  masterControl: GainNode

  channel1: PulseChannel
  channel2: PulseChannel
  channel3: WaveChannel
  channel4: NoiseChannel

  constructor(cpu: CPU) {
    this.cpu = cpu
    this.memory = cpu.memory
    this.memory.registers.audioMasterControl.apu = this
    cpu.apu = this
    cpu.addClockCallback(this)
    this.audioContext.suspend();

    this.masterControl = this.audioContext.createGain()

    this.channel1 = new PulseChannel({
      audioContext: this.audioContext,
      outputNode: this.masterControl,
      registers: this.memory.registers.channel1,
    })
    this.channel2 = new PulseChannel({
      audioContext: this.audioContext,
      outputNode: this.masterControl,
      registers: this.memory.registers.channel2,
    })
    this.channel3 = new WaveChannel({
      audioContext: this.audioContext,
      outputNode: this.masterControl,
      registers: this.memory.registers.channel3
    })
    this.channel4 = new NoiseChannel({
      audioContext: this.audioContext,
      outputNode: this.masterControl,
      registers: this.memory.registers.channel4
    })
    this.masterControl.connect(this.audioContext.destination)
  }

  updateClock(cycles: number) {
    this.channel1.update(cycles)
    this.channel2.update(cycles)
    this.channel3.update(cycles)
    this.channel4.update(cycles)
  }

  startAudio() {
    this.audioContext.resume()
  }

  stopAudio() {
    this.audioContext.suspend()
  }
}