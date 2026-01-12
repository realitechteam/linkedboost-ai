// Admin utilities for LinkedBoost AI

// SuperAdmin email - has full access
export const SUPERADMIN_EMAIL = "dat.ngo2994@gmail.com";

// Check if user is SuperAdmin (by email)
export function isSuperAdmin(email: string | null | undefined): boolean {
    if (!email) return false;
    return email === SUPERADMIN_EMAIL;
}

// Check if user is Admin or higher
export function isAdmin(email: string | null | undefined, role?: string): boolean {
    if (isSuperAdmin(email)) return true;
    return role === "ADMIN" || role === "SUPERADMIN";
}

// Permission levels for different features
export const ADMIN_PERMISSIONS = {
    // SuperAdmin only
    manageAdmins: ["SUPERADMIN"],
    viewAllUsers: ["SUPERADMIN", "ADMIN"],
    viewAnalytics: ["SUPERADMIN", "ADMIN"],
    editPlans: ["SUPERADMIN"],

    // Admin and above
    managePosts: ["SUPERADMIN", "ADMIN"],
    manageSubscriptions: ["SUPERADMIN", "ADMIN"],
    viewReports: ["SUPERADMIN", "ADMIN"],
};

export function hasPermission(
    role: string | undefined,
    permission: keyof typeof ADMIN_PERMISSIONS
): boolean {
    if (!role) return false;
    return ADMIN_PERMISSIONS[permission].includes(role);
}
