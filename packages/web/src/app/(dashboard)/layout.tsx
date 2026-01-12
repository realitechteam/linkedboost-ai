import { redirect } from "next/navigation";
import { DashboardNav } from "@/components/dashboard/nav";
import { auth } from "@/lib/auth";

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    let session;

    try {
        session = await auth();
    } catch (error) {
        // Auth error - redirect to login
        console.error("Auth error:", error);
        redirect("/login");
    }

    if (!session?.user) {
        redirect("/login");
    }

    // Extract safe user data for the nav component
    const user = {
        name: session.user.name || null,
        email: session.user.email || null,
        image: session.user.image || null,
    };

    return (
        <div className="min-h-screen flex">
            <DashboardNav user={user} />
            <main className="flex-1 ml-64">
                <div className="p-8">{children}</div>
            </main>
        </div>
    );
}
