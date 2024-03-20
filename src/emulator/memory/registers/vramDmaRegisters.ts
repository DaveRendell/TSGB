import { ByteRef, GetSetByteRef } from "../../refs/byteRef"

export class VramDmaRegisters {
  sourceAddress: number = 0
  destinationAddress: number = 0
  startInstantTransfer = () => {

  }
  sourceHigh: ByteRef
  sourceLow: ByteRef
  destinationHigh: ByteRef
  destinationLow: ByteRef
  settings: ByteRef

  constructor() {
    this.sourceHigh = new GetSetByteRef(
      () => 0,
      (value) => console.log("Calling Source High with", value.toString(2).padStart(8, "0"))
    )
    this.sourceLow = new GetSetByteRef(
      () => 0,
      (value) => console.log("Calling Source Low with", value.toString(2).padStart(8, "0"))
    )
    this.destinationHigh = new GetSetByteRef(
      () => 0,
      (value) => console.log("Calling Destination High with", value.toString(2).padStart(8, "0"))
    )
    this.destinationLow = new GetSetByteRef(
      () => 0,
      (value) => console.log("Calling Destination Low with", value.toString(2).padStart(8, "0"))
    )
    this.settings = new GetSetByteRef(
      () => 0,
      (value) => console.log("Calling Settings with", value.toString(2).padStart(8, "0"))
    )
  }

}