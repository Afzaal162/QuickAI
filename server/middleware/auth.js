import { createClerkClient } from "@clerk/backend";

// Clerk client (Ensure CLERK_SECRET_KEY is present in your Vercel Project Settings)
const clerkClient = createClerkClient({
    secretKey: process.env.CLERK_SECRET_KEY,
});

export const auth = async (req, res, next) => {
    try {
        // 1. 👇 FIX: Read directly from req.auth populated by global clerkMiddleware()
        const authData = req.auth;
        console.log("AUTH DEBUG STATE:", authData);

        // Check if the global middleware successfully validated the token session
        if (!authData || !authData.userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized: Invalid or missing session token"
            });
        }

        const userId = authData.userId;

        // 2. Fetch user details from Clerk backend to pull up metadata values
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

        // 4. Enforce credit usage limits
        if (plan !== "premium" && freeUsage >= 10) {
            return res.status(403).json({
                success: false,
                message: "Limit reached. Upgrade required."
            });
        }

        // 5. Attach payload attributes safely onto the request pipeline
        req.userId = userId;
        req.plan = plan;
        req.free_usage = freeUsage;
        req.metadata = metadata;

        next();

    } catch (error) {
        console.error("AUTH INTERCEPT ERROR:", error.message);
        return res.status(500).json({
            success: false,
            message: "Authentication processing failed"
        });
    }
};