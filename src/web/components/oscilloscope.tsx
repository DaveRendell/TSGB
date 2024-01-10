import * as React from "react"
import { Channel } from "../../emulator/audio/channel"

interface Props {
  name: string
  id: number
  channel: Channel
}

const SCOPE_WIDTH = 300
const SCOPE_HEIGHT = 50
const ZOOM_FACTOR = 3

export default function Oscilloscope({ name, channel, id }: Props) {
  const scopeCanvas = React.useRef<HTMLCanvasElement>(null)

  const draw = () => {
    if (!scopeCanvas.current) {
      return
    }
    const context = scopeCanvas.current.getContext("2d")!

    const bufferLength = channel.analyser.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)

    context.clearRect(0, 0, SCOPE_WIDTH, SCOPE_HEIGHT)
    channel.analyser.getByteTimeDomainData(dataArray)

    context.lineWidth = 1
    context.strokeStyle = "rgb(0, 0, 0)"

    context.beginPath()

    const sliceWidth = SCOPE_WIDTH / bufferLength
    let x = 0

    for (let i = 0; i < bufferLength; i++) {
      const v = (dataArray[i] - 128) / 128
      const y = (SCOPE_HEIGHT / 2) * (1 + ZOOM_FACTOR * v)

      if (i === 0) {
        context.moveTo(x, y)
      } else {
        context.lineTo(x, y)
      }

      x += sliceWidth
    }

    context.lineTo(SCOPE_WIDTH, SCOPE_HEIGHT / 2)
    context.stroke()
  }

  React.useEffect(() => {
    channel.waveFormChanged = draw
    ;() => {
      channel.waveFormChanged = () => {}
    }
  })

  const isMuted = channel.muteNode.gain.value < 0.1

  const toggleMute = () => {
    if (isMuted) {
      channel.muteNode.gain.value = 1
    } else {
      channel.muteNode.gain.value = 0
    }
  }

  return (
    <div>
      <h3>{name}</h3>
      <label htmlFor={`mute-${id}`}>Mute</label>
      <input
        type="checkbox"
        id={`mute-${id}`}
        checked={isMuted}
        onChange={(e) => {
          e.preventDefault()
          toggleMute()
        }}
      />
      <br />
      <canvas width={SCOPE_WIDTH} height={SCOPE_HEIGHT} ref={scopeCanvas} />
    </div>
  )
}
