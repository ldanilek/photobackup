import { defineComponent } from "convex/server";
import oauth from "../oauth/component.config";
import { v } from "convex/values";

const component = defineComponent("dropbox", {
  args: {
    appKey: v.string(),
    appSecret: v.string(),
    CONVEX_SITE: v.string(),
    redirectAfterLogin: v.string(),
  },
});
const oauthComponent = component.installWithInit(oauth, {
  onInit: (ctx, args) => {
    return {
      CONVEX_SITE: `${args.CONVEX_SITE}/oauth`,
      redirectAfterLogin: args.redirectAfterLogin,
      clientId: args.appKey,
      clientSecret: args.appSecret,
    };
  },
});
component.mountHttp("/oauth/", oauthComponent);

export default component;
