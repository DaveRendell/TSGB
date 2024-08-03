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
  type: "difficultly-selection",
  selection: number
}

export type TetrisMessage =
  NegotiationMessage
  | MusicSelectionUpdateMessage
  | MusicConfirmationMessage
  | DifficultySelectionMessage

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

  if (message.type === "difficultly-selection") {
    if ("selection" in message && typeof message.selection === "number") {
      return {
        type: "difficultly-selection",
        selection: message.selection,
      }
    }
  }

  throw new Error("Unknown message type")
}