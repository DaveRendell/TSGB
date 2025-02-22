import * as React from "react"

import OnlineConnection from "../../../emulator/serialConnections/onlineConnection";
import GameState from "../../../emulator/serialConnections/gameState";
import useAnimationFrame from "../../hooks/useAnimationFrame";

interface Props {
  serialConnection: OnlineConnection<any, GameState<any>>
}

export default function OnlineConnectionForm({ serialConnection }: Props) {
  const [connectionId, setConnectionId] = React.useState("")
  const [isConnected, setIsConnected] = React.useState(serialConnection.state.name === "connected")
  const [stateName, setStateName] = React.useState(serialConnection.gameState.name)
  const [subState, setSubState] = React.useState(JSON.stringify(serialConnection.gameState.state))


  React.useEffect(() => {
    serialConnection.connectedCallback = () => {
      setIsConnected(serialConnection.state.name === "connected")
    }
  }, [serialConnection])

  useAnimationFrame(() => {
    setStateName(serialConnection.gameState.name)
    setSubState(JSON.stringify(serialConnection.gameState.state))
  }, [serialConnection])

  if (isConnected) {
    return <div>
      <p>Connected</p>
      <p>Current state: {stateName}</p>
      <p>Substate:</p>
      <code>
        {subState}
      </code>
    </div>
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