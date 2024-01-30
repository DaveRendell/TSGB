export default interface ScanlineRenderer {
  canvas?: OffscreenCanvas
  colours: number[][]
  windowLine: number
  renderScanline(): void
  renderScreen(): void
}