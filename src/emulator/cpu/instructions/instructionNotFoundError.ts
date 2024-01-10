import { valueDisplay } from "../../../helpers/displayHexNumbers"

export default class InstructionNotFoundError extends Error {
  constructor(code: number) {
    super("Instruction not found for code " + valueDisplay(code))
  }
}