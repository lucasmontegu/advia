import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  clientPrefix: "EXPO_PUBLIC_",
  client: {
    EXPO_PUBLIC_SERVER_URL: z.url(),
    EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN: z.string().startsWith("pk."),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});
