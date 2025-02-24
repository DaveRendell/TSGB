import * as React from "react"
import { Emulator } from "../../emulator/emulator"
import { SerialConnection } from "../../emulator/serialConnections/serialConnection"
import { SerialPort as SerialPortType } from "../../emulator/serialConnections/serialPort"
import { DebugConnection } from "../../emulator/serialConnections/debugConnection"
import { PrinterConnection } from "../../emulator/serialConnections/printerConnection"
import PrinterOutput from "./serialPort/printerOutput"
import { MonGen1MirrorConnection } from "../../emulator/serialConnections/monGen1MirrorConnection"
import TetrisConnection from "../../emulator/serialConnections/tetris/tetrisConnection"
import OnlineConnectionForm from "./serialPort/onlineConnectionForm"
import Gen1Connection from "../../emulator/serialConnections/gen1Link/gen1Connection"

interface Props {
  emulator: Emulator
}

type ConnectionType = SerialPortType["type"]

function createConnection(connectionType: ConnectionType, emulator: Emulator) {
  switch(connectionType) {
    case "debug": return new DebugConnection()
    case "printer": return new PrinterConnection()
    case "gen-1-mirror": return new MonGen1MirrorConnection(emulator)
    case "tetris": return new TetrisConnection(emulator.memory.registers.serialRegisters)
    case "gen1": return new Gen1Connection(emulator.memory.registers.serialRegisters)
  }
}
export default function SerialPort({ emulator }: Props) {
  const [linkType, setLinkType] = React.useState<ConnectionType>(emulator.serialPort.type)

  const handleChange = (id: ConnectionType) => (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    if (e.target.value == "on") {
      setLinkType(id)

      emulator.serialPort.type = id
      emulator.serialPort.connection = createConnection(id, emulator)
    }
  }

  return (
    <section>
      <input
        type="radio"
        id="not-connected"
        checked={linkType == "debug"}
        onChange={handleChange("debug")}
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
        checked={linkType == "gen-1-mirror"}
        onChange={handleChange("gen-1-mirror")}
      />
      <label htmlFor="gen1-mirror">Pokemon Generation I mirror link</label>
      <br/>
      <input
        type="radio"
        id="tetris"
        checked={linkType == "tetris"}
        onChange={handleChange("tetris")}
      />
      <label htmlFor="tetris">Tetris online multiplayer link</label>
      <br/>
      <input
        type="radio"
        id="gen1"
        checked={linkType == "gen1"}
        onChange={handleChange("gen1")}
      />
      <label htmlFor="gen1">Pokemon Generation 1 online multiplayer link</label>
      <br/>

      <br/>

      {
        emulator.serialPort.type === "printer" && <PrinterOutput
          printer={emulator.serialPort.connection}
        />
      }

      {
        emulator.serialPort.type === "tetris" && <OnlineConnectionForm
          serialConnection={emulator.serialPort.connection}
        />
      }

      {
        emulator.serialPort.type === "gen1" && <OnlineConnectionForm
          serialConnection={emulator.serialPort.connection}
        />
      }

    </section>
  )
}