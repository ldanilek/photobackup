import { httpRouter } from "convex/server";
import { componentArg, httpAction } from "./_generated/server";
import { functions } from "./_generated/api";
import cookie from "cookie";

const http = httpRouter();

http.route({
  method: "GET", path: "/callback", handler: httpAction((async (ctx, req) => {
    const url = new URL(req.url);
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
    const csrfToken = url.searchParams.get("state")!;
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
    const code = url.searchParams.get("code")!;

    // TODO: check cookie is set with csrf token.
    // I don't know how to set the cookie (not for lack of trying) so this isn't working.
    /*
    const c = req.headers.get("cookie");
    if (c === null) {
      throw new Error("Missing cookie");
    }
    console.log(c);
    const cookies = cookie.parse(c);
    */
    
    await ctx.runAction(functions.index.exchangeCodeForToken, {
      code,
      csrfToken,
    });
    return Response.redirect(componentArg(ctx, "redirectAfterLogin"));
  })),
});

http.route({
  method: "POST",
  path: "/setCsrf",
  handler: httpAction(async (ctx, req) => {
    const csrfToken = crypto.randomUUID();
    const setCookie = cookie.serialize("csrfToken", csrfToken, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
    });
    return new Response(csrfToken, {
      headers: {
        "Set-Cookie": setCookie,
        "Access-Control-Allow-Origin": "*",
      },
    });
  }),
});

// Pre-flight request for /setCsrf
http.route({
  path: "/setCsrf",
  method: "OPTIONS",
  handler: httpAction(async (_, request) => {
    // Make sure the necessary headers are present
    // for this to be a valid pre-flight request
    const headers = request.headers;
    if (
      headers.get("Origin") !== null &&
      headers.get("Access-Control-Request-Method") !== null &&
      headers.get("Access-Control-Request-Headers") !== null
    ) {
      return new Response(null, {
        headers: new Headers({
          // e.g. https://mywebsite.com, configured on your Convex dashboard
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST",
          "Access-Control-Allow-Headers": "Content-Type, Digest",
          "Access-Control-Max-Age": "86400",
        }),
      });
    } else {
      return new Response();
    }
  }),
});
    
export default http;
    