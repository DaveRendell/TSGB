// BIOS sounds:
/*
C = 0x13
See 0x0083 
LD 0xFF13 <- 0x87

https://gbdev.io/pandocs/Audio_Registers.html

// Volume ticks at 64Hz

// Volume and envelope
Master controls for left and right channels
each channel can be set
channels 1, 2, 4 have an "envelope", basically a setting so they'll change
volume automatically over time

auto shut off: each channel can be auto shut off. Timer ticks at 256Hz, when
timer value reaches 64 it shuts off. Timer can be preset.

Each channel also has a frequency, it's defined in a slightly weird way

Registers:
FF26 Global control - on / off, channels on / off
FF25 channel panning
FF24 master volume and panning

Channel 1
FF10 - sweep
FF11 - length timer and duty cycle
FF12 - volume and envelop
FF13 - low 8 bits of period
FF14 - high 3 bits of period, control
*/

import CPU from "./cpu";
import Memory from "./memory";
import PulseChannel from "./pulseChannel";

export default class APU {
  cpu: CPU
  memory: Memory
  audioContext: AudioContext = new AudioContext({ sampleRate: 44100 });

  channel1: PulseChannel
  channel2: PulseChannel

  constructor(cpu: CPU) {
    this.cpu = cpu
    this.memory = cpu.memory
    cpu.apu = this
    cpu.addClockCallback(this)
    this.audioContext.suspend();
    this.channel1 = new PulseChannel({
      apu: this,
      memory: this.memory,
      periodSweepRegister: 0xFF10,
      lengthTimerRegister: 0xFF11,
      volumeEnvelopeRegister: 0xFF12,
      periodLowRegister: 0xFF13,
      controlRegister: 0xFF14,
    })
    this.channel2 = new PulseChannel({
      apu: this,
      memory: this.memory,
      lengthTimerRegister: 0xFF16,
      volumeEnvelopeRegister: 0xFF17,
      periodLowRegister: 0xFF18,
      controlRegister: 0xFF19,
    })
  }

  updateClock(cycles: number) {
    this.channel1.update(cycles)
    this.channel2.update(cycles)
  }

  startAudio() {
    this.audioContext.resume()
  }

  stopAudio() {
    this.audioContext.suspend()
  }
}