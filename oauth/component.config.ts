import { defineComponent } from "convex/server";
import { v } from "convex/values";
export default defineComponent("oauth", {
  args: {
    CONVEX_SITE: v.string(),
    redirectAfterLogin: v.string(),
    clientId: v.string(),
    clientSecret: v.string(),
  },
});
