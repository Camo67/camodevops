/**
 * Entry worker for the camodevops site.
 *
 * Static assets from output/ still serve assets-first; this code only runs
 * for requests with no matching asset, plus the zone route
 * sos.camodevops.online/app* declared in wrangler.jsonc. On that route it
 * serves the CamoFlow OS app to signed-in Command Center users. It checks
 * only that the sos_auth cookie exists — real session verification stays in
 * the sos-camodevops worker, which owns the domain's other paths; the app
 * page holds no server data (state is browser-local), so presence of the
 * cookie is a courtesy gate, not a security boundary.
 */
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.hostname === "sos.camodevops.online" && (url.pathname === "/app" || url.pathname.startsWith("/app/"))) {
      const signedIn = /(?:^|;\s*)sos_auth=/.test(request.headers.get("Cookie") || "");
      if (!signedIn) return Response.redirect(new URL("/login", url).toString(), 302);
      return env.ASSETS.fetch(new URL("/sos/index.html", url));
    }
    return env.ASSETS.fetch(request);
  },
};
