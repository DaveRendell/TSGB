import * as React from "react"
import { PrinterConnection } from "../../../emulator/serialConnections/printerConnection"

interface Props {
  printer: PrinterConnection
}

export default function PrinterOutput({ printer }: Props) {
  const printerDisplay = React.useRef<HTMLCanvasElement>(null)

  React.useEffect(() => {
    if (printerDisplay.current) {
      const drawPrinterOutput = () => {
        const output = printer.output
        printerDisplay.current.height = output.height

        if (output.height > 0) {
          const context = printerDisplay.current.getContext("2d")!
          const outputContext = output.getContext("2d")!
          const imageData = outputContext.getImageData(0, 0, 160, output.height)

          context.putImageData(imageData, 0, 0)
        }
        requestAnimationFrame(drawPrinterOutput)
      }
      requestAnimationFrame(drawPrinterOutput)
    }
  }, [printerDisplay.current])

  

  return <>
    Output:<br/>
    <canvas className="printer-output" ref={printerDisplay} width={160} height={0}/>
  </>
}