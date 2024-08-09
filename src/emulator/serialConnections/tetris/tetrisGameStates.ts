
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


interface SecondaryReceivingRoundData {
  name: "secondary-receiving-round-data",
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
  | SecondaryMusicSelectionState
  | SecondaryDifficultySelectionState
  | SecondaryReceivingRoundData
  | SecondaryInGame

export default GameStates