
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
  handshakeCounter: number,
}

interface PrimaryInGame {
  name: "primary-in-game"
  paused: boolean
  lines: number
  opponentLines: number
  attackLines: number
  responseCycleCounter: number // todo: probably delete
}

interface PrimaryRoundEnding {
  name: "primary-round-ending"
  opponentState?: "won" | "lost"
  stage: "waiting" | "responding"
}

interface PrimaryRoundEndScreen {
  name: "primary-round-end-screen"
  stage: "waiting" | "byte-1" | "byte-2"
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

interface SecondaryNegotiationHandshake {
  name: "secondary-negotiation-handshake",
  primaryHandshakeByte: number,
  secondaryHandshakeByte: number,
  nextState: GameStates,
  nextStateClockStart: number,
}

interface SecondaryReceivingData {
  name: "secondary-receiving-data",
  data: number[],
  nextState: GameStates,
  nextStateClockStart: number,
}

interface SecondaryInGame {
  name: "secondary-in-game"
  paused: boolean
  linesBuffer: number
  lines: number
  opponentLines: number
  attackLines: number
}

interface SecondaryRoundEnding {
  name: "secondary-round-ending"
  opponentState?: "won" | "lost"
  stage: "waiting" | "responding" | "terminating"
}

interface SecondaryRoundEndScreen {
  name: "secondary-round-end-screen",
  stage: "waiting" | "byte-1" | "byte-2"
  lineData: number[]
  pieceData: number[]
}

type GameStates =
  NegotiationState
  | PrimaryMusicSelectionState
  | PrimaryDifficultySelectionState
  | PrimaryDataHandshake
  | PrimarySendingLineData
  | PrimarySendingPieceData
  | PrimaryInGame
  | PrimaryRoundEnding
  | PrimaryRoundEndScreen
  | SecondaryMusicSelectionState
  | SecondaryDifficultySelectionState
  | SecondaryNegotiationHandshake
  | SecondaryReceivingData
  | SecondaryInGame
  | SecondaryRoundEnding
  | SecondaryRoundEndScreen

export default GameStates