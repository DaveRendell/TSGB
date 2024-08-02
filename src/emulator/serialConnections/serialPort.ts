import { DebugConnection } from "./debugConnection"
import { MonGen1MirrorConnection } from "./monGen1MirrorConnection"
import { PrinterConnection } from "./printerConnection"

interface DebugSerialPort {
  type: "debug"
  connection: DebugConnection
}

interface PrinterSerialPort {
  type: "printer"
  connection: PrinterConnection
}

interface Gen1MirrorSerialPort {
  type: "gen-1-mirror"
  connection: MonGen1MirrorConnection
}

export type SerialPort =
  DebugSerialPort
  | PrinterSerialPort
  | Gen1MirrorSerialPort
