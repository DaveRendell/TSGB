import { DebugConnection } from "./debugConnection"
import Gen1Connection from "./gen1Link/gen1Connection"
import { MonGen1MirrorConnection } from "./monGen1MirrorConnection"
import { PrinterConnection } from "./printerConnection"
import TetrisConnection from "./tetris/tetrisConnection"

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

interface TetrisSerialPort {
  type: "tetris"
  connection: TetrisConnection
}

interface Gen1SerialPort {
  type: "gen1"
  connection: Gen1Connection
}

export type SerialPort =
  DebugSerialPort
  | PrinterSerialPort
  | Gen1MirrorSerialPort
  | TetrisSerialPort
  | Gen1SerialPort
