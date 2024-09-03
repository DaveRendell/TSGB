import * as React from "react"
import { PrinterConnection } from "../../../emulator/serialConnections/printerConnection"

interface Props {
  printer: PrinterConnection
}

export default function PrinterOutput({ printer }: Props) {
  const printerDisplay = React.useRef<HTMLCanvasElement>(null)

  React.useEffect(() => {
    console.log("Setting displayCanvas to ", printerDisplay.current)
    printer.displayCanvas = printerDisplay.current
    return () => {
      printer.displayCanvas = undefined
    }
  }, [printerDisplay.current])

  return <>
    Output:<br/>
    <canvas className="printer-output" ref={printerDisplay} width={160} height={0}/>
  </>
}