
interface NegotiationState {
  name: "negotiation",
  negotiationRequested: boolean
}

// Primary states
interface PrimaryMusicSelectionState {
  name: "primary-music-selection",
  currentSelection: number
}

// Secondary states
interface SecondaryMusicSelectionState {
  name: "secondary-music-selection",
  currentSelection: number
}

type GameStates =
  NegotiationState
  | PrimaryMusicSelectionState
  | SecondaryMusicSelectionState

export default GameStates