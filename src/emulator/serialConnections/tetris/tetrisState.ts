import { TetrisMessage } from "./tetrisMessages";
import TetrisConnection from "./tetrisConnection";
import GameState from "../gameState";
import OnlineConnection from "../onlineConnection";

export default abstract class TetrisState extends GameState<TetrisMessage> {
  protected connection: TetrisConnection
  constructor(
    connection: TetrisConnection,
  ) {
    super(connection)
  }

  gameName = "TETRIS"
}