import { defineApp } from "convex/server";
import dropbox from "../dropbox/component.config";

const app = defineApp();

const dropboxComponent = app.install(dropbox, {
  args: {
    appKey: process.env.DROPBOX_CLIENT_ID!,
    appSecret: process.env.DROPBOX_SECRET!,
    CONVEX_SITE: `${process.env.CONVEX_SITE_URL}/dropbox`,
    redirectAfterLogin: `http://localhost:5173`,
  },
});
app.mountHttp("/dropbox/", dropboxComponent);

export default app;
