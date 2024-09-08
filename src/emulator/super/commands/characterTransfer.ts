import SuperEmulator from "../superEmulator";

export default function characterTransfer(
  superEmulator: SuperEmulator,
  data: number[],
): void {
  const target = [0, 0x1000][data[0] & 0x1]
  superEmulator.log("CHR_TRN command received", data[0] & 0x1)

  superEmulator.scanlineRenderer.vramTransferRequested = true
  superEmulator.tileDestination = (data[0] & 0x1) > 0 ? 0x1000 : 0
  superEmulator.vramTransferType = "character"
}
