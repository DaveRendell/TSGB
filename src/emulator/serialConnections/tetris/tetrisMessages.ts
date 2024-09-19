// Send when a player picks multiplayer, and assumes primary role
interface NegotiationMessage {
  type: "negotiation"
}

// Sent by primary when updating music choice
interface MusicSelectionUpdateMessage {
  type: "music-selection-update",
  selection: number
}

// Sent by primary to confirm choice of music
interface MusicConfirmationMessage {
  type: "music-confirmation"
}

// Sent by primary or secondary when they update their difficulty selection
interface DifficultySelectionMessage {
  type: "difficulty-selection",
  selection: number
}

// Sent by primary to confirm difficulty choices
interface DifficultyConfirmationMessage {
  type: "difficulty-confirmation"
}

interface RoundDataMessage {
  type: "round-data",
  lineData: number[],
  pieceData: number[],
}

interface PauseMessage {
  type: "pause",
  paused: boolean
}

interface LinesMessage {
  type: "lines",
  lines: number
}

interface AttackMessage {
  type: "attack"
  size: number
}

export type TetrisMessage =
  NegotiationMessage
  | MusicSelectionUpdateMessage
  | MusicConfirmationMessage
  | DifficultySelectionMessage
  | RoundDataMessage
  | PauseMessage
  | LinesMessage
  | AttackMessage

export function parseMessage(message: any): TetrisMessage {
  if (
    typeof message !== "object"
    || !("type" in message)
    || typeof message.type !== "string"
  ) {
    throw new Error("Unknown message type")
  }

  if (message.type === "negotiation") {
    return { type: "negotiation" }
  }

  if (message.type === "music-selection-update") {
    if ("selection" in message && typeof message.selection === "number") {
      return {
        type: "music-selection-update",
        selection: message.selection,
      }
    }
  }

  if (message.type === "music-confirmation") {
    return { type: "music-confirmation" } 
  }

  if (message.type === "difficulty-selection") {
    if ("selection" in message && typeof message.selection === "number") {
      return {
        type: "difficulty-selection",
        selection: message.selection,
      }
    }
  }

  if (message.type === "round-data") {
    if (
      "lineData" in message
      && typeof message.lineData === "object"
      && Array.isArray(message.lineData)
      && message.lineData.length > 0
      && typeof message.lineData[0] === "number"
      && "pieceData" in message
      && typeof message.pieceData === "object"
      && Array.isArray(message.pieceData)
      && message.pieceData.length > 0
      && typeof message.pieceData[0] === "number"
    ) {
      return {
        type: "round-data",
        lineData: message.lineData,
        pieceData: message.pieceData,
      }
    }
  }

  if (message.type === "pause") {
    if ("paused" in message) {
      return {
        type: "pause",
        paused: message.paused
      }
    }
  }

  if (message.type === "lines") {
    if ("lines" in message) {
      return {
        type: "lines",
        lines: message.lines
      }
    }
  }

  if (message.type === "attack") {
    if ("size" in message) {
      return {
        type: "attack",
        size: message.size
      }
    }
  }

  throw new Error("Unknown message type")
}