import { z } from "zod";

const ConfirmLinkType = z.object({
  type: z.literal("confirm-link-type"),
  linkType: z.union([
    z.literal("trade"),
    z.literal("battle"),
    z.literal("cancel"),
  ])
})

export default ConfirmLinkType
