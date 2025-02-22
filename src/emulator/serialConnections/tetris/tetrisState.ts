import { TetrisMessage } from "./tetrisMessages";
import TetrisConnection from "./tetrisConnection";
import GameState from "../gameState";

export default abstract class TetrisState extends GameState<TetrisMessage> {
  constructor(
    connection: TetrisConnection,
  ) {
    super(connection)
  }

  gameName = "TETRIS"
}