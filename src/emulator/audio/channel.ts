export interface Channel {
  analyser: AnalyserNode
  muteNode: GainNode
  update(cycles: number): void
  waveFormChanged: () => void
}
