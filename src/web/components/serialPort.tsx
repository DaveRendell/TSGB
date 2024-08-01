import * as React from "react"
import { Emulator } from "../../emulator/emulator"
import { SerialConnection } from "../../emulator/serialConnections/serialConnection"
import { DebugConnection } from "../../emulator/serialConnections/debugConnection"
import { PrinterConnection } from "../../emulator/serialConnections/printerConnection"
import PrinterOutput from "./serialPort/printerOutput"
import { MonGen1MirrorConnection } from "../../emulator/serialConnections/monGen1MirrorConnection"

interface Props {
  emulator: Emulator
}

type ConnectionType = "not-connected" | "printer" | "gen1-mirror"

function createConnection(connectionType: ConnectionType, emulator: Emulator): SerialConnection {
  switch(connectionType) {
    case "not-connected": return new DebugConnection()
    case "printer": return new PrinterConnection()
    case "gen1-mirror": return new MonGen1MirrorConnection(emulator)
  }
}
export default function SerialPort({ emulator }: Props) {
  const [linkType, setLinkType] = React.useState<ConnectionType>("not-connected")

  const handleChange = (id: ConnectionType) => (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    if (e.target.value == "on") {
      setLinkType(id)
      emulator.memory.registers.serialRegisters.serialConnection = createConnection(id, emulator)
    }
  }

  return (
    <section>
      <input
        type="radio"
        id="not-connected"
        checked={linkType == "not-connected"}
        onChange={handleChange("not-connected")}
      />
      <label htmlFor="not-connected">Not connected</label>
      <br/>
      <input
        type="radio"
        id="printer"
        checked={linkType == "printer"}
        onChange={handleChange("printer")}
      />
      <label htmlFor="printer">Printer</label>
      <br/>
      <input
        type="radio"
        id="gen1-mirror"
        checked={linkType == "gen1-mirror"}
        onChange={handleChange("gen1-mirror")}
      />
      <label htmlFor="gen1-mirror">Pokemon Generation I mirror link</label>
      <br/>

      <br/>

      {
        linkType === "printer" && <PrinterOutput
          printer={emulator.memory.registers.serialRegisters.serialConnection as PrinterConnection}
        />
      }

    </section>
  )
}