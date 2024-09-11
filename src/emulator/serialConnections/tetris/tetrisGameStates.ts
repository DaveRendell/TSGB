
interface NegotiationState {
  name: "negotiation",
  negotiationRequested: boolean
}

// Primary states
interface PrimaryMusicSelectionState {
  name: "primary-music-selection",
  currentSelection: number
}

interface PrimaryDifficultySelectionState {
  name: "primary-difficulty-selection",
  localSelection: number,
  remoteSelection: number,
}

interface PrimaryInGame {
  name: "primary-in-game"
}

// Secondary states
interface SecondaryMusicSelectionState {
  name: "secondary-music-selection",
  currentSelection: number
}

interface SecondaryDifficultySelectionState {
  name: "secondary-difficulty-selection",
  localSelection: number,
  remoteSelection: number,
}

interface PrimaryDataHandshake {
  name: "primary-data-handshake",
  started: boolean
}

interface PrimarySendingLineData {
  name: "primary-sending-line-data",
  dataBuffer: number[],
  finished: boolean
}

interface PrimarySendingPieceData {
  name: "primary-sending-piece-data",
  dataBuffer: number[],
  lineData: number[],
  finished: boolean,
  handshakeCounter: number
}

interface SecondaryNegotiationHandshake {
  name: "secondary-negotiation-handshake",
  primaryHandshakeByte: number,
  secondaryHandshakeByte: number,
  nextState: GameStates
}

interface SecondaryReceivingRoundLines {
  name: "secondary-receiving-round-lines",
  dataBuffer: number[]
  piecesData: number[]
}

interface SecondaryReceivingRoundPieces {
  name: "secondary-receiving-round-pieces"
  dataBuffer: number[]
}

interface SecondaryReceivingMagicBytes {
  name: "secondary-receiving-magic-bytes"
  dataBuffer: number[]
}

interface SecondaryInGame {
  name: "secondary-in-game"
}

type GameStates =
  NegotiationState
  | PrimaryMusicSelectionState
  | PrimaryDifficultySelectionState
  | PrimaryDataHandshake
  | PrimarySendingLineData
  | PrimarySendingPieceData
  | PrimaryInGame
  | SecondaryNegotiationHandshake
  | SecondaryMusicSelectionState
  | SecondaryDifficultySelectionState
  | SecondaryReceivingRoundLines
  | SecondaryReceivingRoundPieces
  | SecondaryReceivingMagicBytes
  | SecondaryInGame

export default GameStates