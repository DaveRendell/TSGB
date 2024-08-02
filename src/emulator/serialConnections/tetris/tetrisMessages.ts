interface NegotiationMessage {
  type: "negotiation"
}

export type TetrisMessage =
  NegotiationMessage

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

  throw new Error("Unknown message type")
}