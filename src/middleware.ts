import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

/**
 * Public routes — accessible WITHOUT authentication.
 * Everything else is strictly protected and will redirect to /auth.
 */
const isPublicRoute = createRouteMatcher([
  "/",              // Landing page
  "/auth(.*)",      // Login / signup / verification / link-wallet
  "/api(.*)",       // Next.js API routes (if any)
  "/bounties(.*)",  // Public bounty browsing (backend is unauthenticated too)
  "/dao(.*)",       // DAO disputes are publicly viewable
  "/profile(.*)",   // Public profile pages
]);

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    const { userId } = await auth();

    if (!userId) {
      // Redirect unauthenticated users to the auth page
      const authUrl = new URL("/auth", req.url);
      authUrl.searchParams.set("redirect_url", req.nextUrl.pathname);
      return NextResponse.redirect(authUrl);
    }
  }
});

export const config = {
  // Run middleware on all routes except Next.js internals and static files
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
