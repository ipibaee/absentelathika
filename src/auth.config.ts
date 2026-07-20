import type { NextAuthConfig } from "next-auth"

export const authConfig = {
    pages: {
        signIn: "/login",
    },
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user
            const isOnDashboard = nextUrl.pathname.startsWith("/dashboard")
            const isOnRecord = nextUrl.pathname.startsWith("/record")

            // Require login for authenticated routes
            if (isOnDashboard || isOnRecord) {
                if (isLoggedIn) return true
                return false // Redirect to login
            }

            return true
        },
    },
    providers: [], // Configured in auth.ts
} satisfies NextAuthConfig
