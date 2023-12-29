import CPU from "./cpu";
import Memory from "./memory";
import PulseChannel from "./sound/pulseChannel";
import WaveChannel from "./sound/waveChannel";

// Reference: https://gbdev.io/pandocs/Audio_Registers.html
export default class APU {
  cpu: CPU
  memory: Memory
  audioContext: AudioContext = new AudioContext({ sampleRate: 44100 });

  channel1: PulseChannel
  channel2: PulseChannel
  channel3: WaveChannel

  constructor(cpu: CPU) {
    this.cpu = cpu
    this.memory = cpu.memory
    cpu.apu = this
    cpu.addClockCallback(this)
    this.audioContext.suspend();
    this.channel1 = new PulseChannel({
      audioContext: this.audioContext,
      registers: this.memory.registers.channel1,
    })
    this.channel2 = new PulseChannel({
      audioContext: this.audioContext,
      registers: this.memory.registers.channel2,
    })
    this.channel3 = new WaveChannel({
      audioContext: this.audioContext,
      registers: this.memory.registers.channel3
    })
  }

  updateClock(cycles: number) {
    this.channel1.update(cycles)
    this.channel2.update(cycles)
    this.channel3.update(cycles)
  }

  startAudio() {
    this.audioContext.resume()
  }

  stopAudio() {
    this.audioContext.suspend()
  }
}