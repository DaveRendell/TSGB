import { z } from "zod";

const Connected = z.object({
  type: z.literal("connected")
})

export default Connected