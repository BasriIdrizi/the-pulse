import NextAuth from "next-auth";
import { cache } from "react";
import { authConfig } from "./config";

const { auth: uncachedAuth, handlers, signIn, signOut } = NextAuth(authConfig);

// React cache dedupes session lookups within a single RSC render pass.
const auth = cache(uncachedAuth);

export { auth, handlers, signIn, signOut };
