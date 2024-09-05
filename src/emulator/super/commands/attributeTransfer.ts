import SuperEmulator from "../superEmulator";

export default function attributeTransfer(
  superEmulator: SuperEmulator
): void {
  superEmulator.log("ATTR_TRN command received")

  superEmulator.scanlineRenderer.vramTransferRequested = true
  superEmulator.vramTransferType = "attribute"
}
