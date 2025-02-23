import SerialRegisters from "../../memory/registers/serialRegisters"
import OnlineConnection from "../onlineConnection"
import NegotiationState from "./states/negotiationState"
import { TetrisMessage, parseMessage } from "./tetrisMessages"
import TetrisState from "./tetrisState"

export default class TetrisConnection extends OnlineConnection<TetrisMessage, TetrisState> {
  roundsWon = 0
  opponentRoundsWon = 0
  constructor(serialRegisters: SerialRegisters) {
    super(serialRegisters, (self: TetrisConnection) => new NegotiationState(self), parseMessage)
  }

  gameOver(): boolean {
    return this.roundsWon >= 4 || this.opponentRoundsWon >= 4
  }
}
