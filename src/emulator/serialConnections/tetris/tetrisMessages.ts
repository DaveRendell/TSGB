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

// Random line data sent by primary before match starts to ensure same lines show up
interface LineDataMessage {
  type: "line-data",
  data: number[]
}

// Random piece data sent by primary before match starts to ensure same pieces show up
interface PieceDataMessage {
  type: "piece-data",
  data: number[]
}

export type TetrisMessage =
  NegotiationMessage
  | MusicSelectionUpdateMessage
  | MusicConfirmationMessage
  | DifficultySelectionMessage
  | DifficultyConfirmationMessage
  | LineDataMessage
  | PieceDataMessage

export function parseMessage(message: any): TetrisMessage {
  if (
    typeof message !== "object"
    || "type" in message
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

  if (message.type === "difficulty-confirmation") {
    return { type: "difficulty-confirmation" }
  }

  if (message.type === "line-data") {
    if (
      "data" in message
      && typeof message.data === "object"
      && Array.isArray(message.data)
      && message.data.length > 0
      && typeof message.data[0] === "number"
    ) {
      return {
        type: "line-data",
        data: message.data
      }
    }
  }

  if (message.type === "piece-data") {
    if (
      "data" in message
      && typeof message.data === "object"
      && Array.isArray(message.data)
      && message.data.length > 0
      && typeof message.data[0] === "number"
    ) {
      return {
        type: "piece-data",
        data: message.data
      }
    }
  }

  throw new Error("Unknown message type")
}