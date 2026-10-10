import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

const allowedAdmins = (process.env.GODSOTV_ADMIN_EMAILS ?? "")
  .split(",").map((email) => email.trim().toLowerCase()).filter(Boolean);

export const { handlers, auth, signIn, signOut } = NextAuth({
  // Render runs behind a reverse proxy and forwards the public host headers.
  trustHost: true,
  adapter: PrismaAdapter(prisma),
  session: { strategy: "database" },
  providers: [GitHub],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider !== "github") return false;
      const email = user.email?.toLowerCase();
      // Only allow explicitly allowlisted GitHub accounts to sign in to this private studio.
      return Boolean(email && allowedAdmins.includes(email));
    },
    async session({ session, user }) {
      if (session.user) {
        (session.user as typeof session.user & { id: string; role: string }).id = user.id;
        (session.user as typeof session.user & { id: string; role: string }).role =
          allowedAdmins.includes(user.email?.toLowerCase() ?? "") ? "OWNER" : "VIEWER";
      }
      return session;
    },
  },
  pages: { signIn: "/admin/login" },
});
