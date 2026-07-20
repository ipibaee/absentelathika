import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { authConfig } from "./auth.config"

// Extend NextAuth types to hold role and username
declare module "next-auth" {
  interface User {
    role?: string
    username?: string
  }
  interface Session {
    user: {
      id: string
      role?: string
      username?: string
    } & import("next-auth").DefaultSession["user"]
  }
}

async function getUser(username: string) {
    try {
        const user = await prisma.user.findUnique({
            where: { username },
        })
        return user
    } catch (error) {
        console.error("Failed to fetch user:", error)
        throw new Error("Failed to fetch user.")
    }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
    ...authConfig,
    providers: [
        Credentials({
            async authorize(credentials) {
                const parsedCredentials = z
                    .object({ username: z.string().min(3), password: z.string().min(6) })
                    .safeParse(credentials)

                if (parsedCredentials.success) {
                    const { username, password } = parsedCredentials.data
                    const user = await getUser(username)
                    if (!user) return null

                    const passwordsMatch = await bcrypt.compare(password, user.password)
                    if (passwordsMatch) {
                        return {
                            id: user.id,
                            name: user.username,
                            username: user.username,
                            role: user.role,
                        }
                    }
                }

                console.log("Invalid credentials")
                return null
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.role = user.role
                token.username = user.username
            }
            return token
        },
        async session({ session, token }) {
            if (token.sub && session.user) {
                session.user.id = token.sub
                session.user.role = token.role as string
                session.user.username = token.username as string
            }
            return session
        },
    },
})
