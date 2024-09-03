import * as React from "react"
import { PrinterConnection } from "../../../emulator/serialConnections/printerConnection"

interface Props {
  printer: PrinterConnection
}

export default function PrinterOutput({ printer }: Props) {
  const printerDisplay = React.useRef<HTMLCanvasElement>(null)

  React.useEffect(() => {
    printer.displayCanvas = printerDisplay.current
    printer.updateDisplay()
    
    return () => {
      printer.displayCanvas = undefined
    }
  }, [printerDisplay.current])

  return <>
    <button onClick={() => printer.clearOutput()}>Clear</button><br/>
    Output:<br/>
    <canvas className="printer-output" ref={printerDisplay} width={160} height={0}/>
  </>
}