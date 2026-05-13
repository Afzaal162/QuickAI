import { createClerkClient } from "@clerk/backend";
import { getAuth } from "@clerk/express";

// Clerk client (make sure CLERK_SECRET_KEY is correct)
const clerkClient = createClerkClient({
    secretKey: process.env.CLERK_SECRET_KEY,
});

export const auth = async (req, res, next) => {
    try {
        // 1. Safely extract auth
        const authData = getAuth(req);
        console.log("AUTH DEBUG:", authData);

        if (!authData?.userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized"
            });
        }

        const userId = authData.userId;

        // 2. Fetch user from Clerk
        const user = await clerkClient.users.getUser(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // 3. Normalize metadata safely
        const metadata = user.privateMetadata || {};

        const freeUsage = Number(metadata.free_usage ?? 0);
        const plan = metadata.plan || "free";

        // 4. Enforce limit (server-side protection)
        if (plan !== "premium" && freeUsage >= 10) {
            return res.status(403).json({
                success: false,
                message: "Limit reached. Upgrade required."
            });
        }

        // 5. Attach to request (single source of truth)
        req.userId = userId;
        req.plan = plan;
        req.free_usage = freeUsage;
        req.metadata = metadata;

        next();

    } catch (error) {
        console.error("AUTH ERROR:", error.message);

        return res.status(500).json({
            success: false,
            message: "Authentication failed"
        });
    }
};