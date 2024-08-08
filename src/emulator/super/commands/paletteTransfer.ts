import SuperEmulator from "../superEmulator";

export default function paletteTransfer(
  superEmulator: SuperEmulator
): void {
  superEmulator.scanlineRenderer.vramTransferRequested = true
  superEmulator.vramTransferType = "palette"
}
