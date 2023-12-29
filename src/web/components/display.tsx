import * as React from "react"
import CPU from "../../emulator/cpu"
import Screen from "../../emulator/screen"

interface Props {
  cpu: CPU
}

export default function Display({ cpu }: Props) {
  const canvas = React.useRef<HTMLCanvasElement>(null)

  const [_, setScreen] = React.useState<Screen | null>(null)

  React.useEffect(() => {
    if (canvas.current) {
      cpu.screen.canvas = canvas.current
      setScreen(cpu.screen)
    }
  }, [canvas])

  return (
    <section>
      <canvas
        className="screen"
        width="160"
        height="144"
        ref={canvas}
      />
    </section>
  )
}