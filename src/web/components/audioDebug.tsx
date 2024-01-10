import * as React from "react"
import AudioProcessor from "../../emulator/audio/audioProcessor"
import Oscilloscope from "./oscilloscope"

interface Props {
  audioProcessor: AudioProcessor
}

export default function AudioDebug({ audioProcessor }: Props) {
  return (
    <section>
      <div className="flex-horizontally">
        <Oscilloscope name="Pulse 1" channel={audioProcessor.channel1} id={0} />
        <Oscilloscope name="Pulse 2" channel={audioProcessor.channel2} id={1} />
      </div>
      <div className="flex-horizontally">
        <Oscilloscope name="Wave" channel={audioProcessor.channel3} id={2} />
        <Oscilloscope name="Noise" channel={audioProcessor.channel4} id={3} />
      </div>
    </section>
  )
}
