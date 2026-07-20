import { redirect } from "next/navigation"
import { auth } from "@/auth"
import LoginForm from "@/components/auth/LoginForm"

export default async function LoginPage() {
    const session = await auth()

    // If already logged in, redirect straight to their dashboard or recording page
    if (session && session.user) {
        if (session.user.role === "ADMIN") {
            redirect("/dashboard")
        } else {
            redirect("/record")
        }
    }

    return <LoginForm />
}
