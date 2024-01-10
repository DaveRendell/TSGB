import * as React from "react"
import { Emulator } from "../../emulator/emulator"
import Peer, { DataConnection } from "peerjs"

interface Props {
  emulator: Emulator
}

export default function SerialPort({ emulator }: Props) {
  const [connectionId, setConnectionId] = React.useState<string>("")
  const [linkType, setLinkType] = React.useState("not-connected")
  const [peer, setPeer] = React.useState<Peer | undefined>(undefined)
  const [connection, setConnection] = React.useState<DataConnection | undefined>(undefined)

  React.useEffect(() => {
    if (linkType === "link-cable") {
      const peer = new Peer()
      const serialRegisters = emulator.memory.registers.serialRegisters

      peer.addListener("connection", (connection) => {
        serialRegisters.sendByte = (byte: number) =>
          connection.send(byte.toString(16))
        connection.on("data", (data) =>
          serialRegisters.onReceiveByte(parseInt("0x" + data)))
        setConnection(connection)
      })

      setPeer(peer)
      return () => { peer.disconnect() }
    }
  }, [linkType])

  const handleChange = (id: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    if (e.target.value == "on") { setLinkType(id) }
  }

  const connect = () => {
    if (peer) {
      const serialRegisters = emulator.memory.registers.serialRegisters

      const connection = peer.connect(connectionId)

      serialRegisters.sendByte = (byte: number) =>
        connection.send(byte.toString(16))
      connection.on("data", (data) =>
        serialRegisters.onReceiveByte(parseInt("0x" + data)))
      setConnection(connection)
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
        id="link-cable"
        checked={linkType == "link-cable"}
        onChange={handleChange("link-cable")}
      />
      <label htmlFor="link-cable">Link cable</label>

      { linkType === "link-cable" && <>
          {connection ? "Connected" : ""}
          { peer
            ? <>
              <input type="text" value={connectionId} onChange={e => {e.preventDefault(); setConnectionId(e.target.value)}} />
              <button onClick={connect}>Link</button>
              <br/>Your ID: {peer.id}
            </>
            : <>Connecting to server...</>}
          
        </>
      }
    </section>
  )
}