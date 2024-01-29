export default interface ScanlineRenderer {
  canvas?: HTMLCanvasElement
  colours: number[][]
  windowLine: number
  renderScanline(): void
  renderScreen(): void
}