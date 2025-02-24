import GameState from "../gameState";
import Gen1Connection from "./gen1Connection";
import Gen1Message from "./gen1Message";

export default abstract class Gen1State extends GameState<Gen1Message> {
  protected connection: Gen1Connection
  constructor(
    connection: Gen1Connection
  ) {
    super(connection)
  }

  gameName = "GEN1"
}