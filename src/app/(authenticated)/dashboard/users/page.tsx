import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { getUsers } from "@/actions/users"
import { UsersClient } from "@/components/dashboard/UsersClient"

export default async function UsersPage() {
    const session = await auth()
    if (!session || session.user.role !== "ADMIN") {
        redirect("/record")
    }

    const usersResult = await getUsers()
    const initialUsers = usersResult.success ? usersResult.users || [] : []

    return (
        <UsersClient 
            initialUsers={initialUsers} 
            currentUser={session.user} 
        />
    )
}
