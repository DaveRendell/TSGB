import * as React from "react"

import OnlineConnection from "../../../emulator/serialConnections/onlineConnection";
import { TetrisMessage } from "../../../emulator/serialConnections/tetris/tetrisMessages";

interface Props {
  serialConnection: OnlineConnection<TetrisMessage>
}

export default function OnlineConnectionForm({ serialConnection }: Props) {
  const [connectionId, setConnectionId] = React.useState("")
  const [isConnected, setIsConnected] = React.useState(serialConnection.state.name === "connected")

  React.useEffect(() => {
    serialConnection.connectedCallback = () => {
      setIsConnected(serialConnection.state.name === "connected")
    }
  }, [serialConnection])

  if (isConnected) {
    return <>Connected!</>
  }

  const submitForm = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    await serialConnection.setupConnection(connectionId)

    setIsConnected(serialConnection.state.name === "connected")
  }

  return <>
    Your connection ID: <code>{serialConnection.peer.id}</code>
    <form onSubmit={e => submitForm(e)}>
      <label htmlFor="connection-id">Enter another player's ID</label>
      <input
        type="text"
        name="connection-id"
        id="connection-id"
        onChange={e => setConnectionId(e.target.value)}
        value={connectionId}
      />
      <input
        type="submit"
        value="Connect"
      />
    </form>
  </>
}