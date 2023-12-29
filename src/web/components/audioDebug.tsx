import * as React from "react"
import APU from "../../emulator/apu"
import Oscilloscope from "./oscilloscope"

interface Props {
  apu: APU
}

export default function AudioDebug({ apu }: Props) {
  return (<section>
    <div className="flex-horizontally">
      <Oscilloscope name="Pulse 1" channel={apu.channel1} id={0} />
      <Oscilloscope name="Pulse 2" channel={apu.channel2} id={1} />
    </div>
    <div className="flex-horizontally">
      <Oscilloscope name="Wave" channel={apu.channel3} id={2} />
      <div>
        <h3>Noise</h3>
        TODO
      </div>
      {/* <Oscilloscope name="Noise" channel={apu.channel4} id={3} /> */}
    </div>   
  </section>)
}