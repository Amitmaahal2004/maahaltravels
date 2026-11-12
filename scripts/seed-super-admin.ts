
import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

import connectToDatabase from "../src/lib/mongodb";
import User from "../src/models/User";
import Role from "../src/models/Role";
import { hashPassword } from "../src/lib/auth/password";

async function seedSuperAdmin() {
    try {
        await connectToDatabase();

        const email = (
            process.env.SEED_ADMIN_EMAIL || "admin@travelagency.com"
        ).toLowerCase();

        const password = process.env.SEED_ADMIN_PASSWORD;

        if (!password) {
            throw new Error("SEED_ADMIN_PASSWORD is required.");
        }

        // Find or create Super Admin role
        let role = await Role.findOne({ slug: "super-admin" });

        if (!role) {
            role = await Role.create({
                name: "Super Admin",
                slug: "super-admin",
                description: "Full unrestricted system access",
                isSystem: true,
                permissions: [],
                defaultRecordScope: "all",
            });
        }

        // Find existing admin
        let admin = await User.findOne({ email });

        if (admin) {
            if (process.env.SEED_ADMIN_RESET !== "true") {
                console.log("Admin already exists. No changes made.");
                return;
            }

            admin.passwordHash = await hashPassword(password);
            admin.roleId = role._id;
            admin.status = "active";
            admin.failedLoginAttempts = 0;
            admin.lockUntil = undefined;

            await admin.save();

            console.log("Existing Super Admin password reset successfully.");
        } else {
            admin = await User.create({
                name: "Development Super Admin",
                email,
                passwordHash: await hashPassword(password),
                roleId: role._id,
                status: "active",
                isEmailVerified: true,
                failedLoginAttempts: 0,
            });

            console.log("Super Admin created successfully.");
        }

        console.log("Admin Email:", email);
        console.log("Role:", role.slug);

    } catch (error) {
        console.error("Super Admin Seeder Error:", error);
        process.exitCode = 1;
    }
}

seedSuperAdmin();

