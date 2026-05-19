import sql from '../config/db.js'

export const getUserCreation = async (req, res) => {
    try {
        // 👇 FIX: Remove the function parentheses () -> req.auth is an object!
        const { userId } = req.auth; 

        // If the token parsing was clean but no user context exists, bounce safely
        if (!userId) {
            return res.status(401).json({ success: false, message: "Unauthorized: No user session found" });
        }

        // Run your neon/pg-sql database query using the verified clerk userId string
        const creations = await sql`SELECT * FROM creations WHERE user_id = ${userId} ORDER BY created_at DESC`;
        
        // Return a successful 200 status alongside the database rows
        return res.status(200).json({ 
            success: true, 
            creations: creations 
        }); 

    } catch (error) {
        console.error("Database Controller Error:", error.message);
        return res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
}
export const getPublishedCreation = async (req, res) => {
    try {
const creations = await sql`SELECT * FROM creations ORDER BY created_at DESC LIMIT 20`;        
        // Change 'message' to 'creations'
res.json({ success: true, creations: creations })
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}
export const toggleLikeCreation = async (req, res) => {
    try {
        const { userId } = req.auth();
        
        // FIX: Extract the specific ID from the object
        const { creationId } = req.body; 

        // 1. Fetch the creation (using the extracted ID)
        const [creation] = await sql`SELECT * FROM creations WHERE id = ${creationId}`;
        
        if (!creation) {
            return res.json({ success: false, message: 'Creation Not Found' });
        }

        const currentLikes = creation.likes || []; // Handle null/undefined likes
        const userIdStr = userId.toString();
        let updatedLikes;
        let message;

        if (currentLikes.includes(userIdStr)) {
            updatedLikes = currentLikes.filter((user) => user !== userIdStr);
            message = 'Creation Unliked';
        } else {
            updatedLikes = [...currentLikes, userIdStr];
            message = 'Creation Liked';
        }

        // 2. Update the database
        // Note: Check if your SQL driver handles arrays naturally. 
        // If it's 'postgres.js', you can usually just pass the array directly:
        // await sql`UPDATE creations SET likes = ${updatedLikes} WHERE id = ${creationId}`
        
        const formattedArray = `{${updatedLikes.join(',')}}`;
        await sql`UPDATE creations SET likes = ${formattedArray}::text[] WHERE id = ${creationId}`;

        res.json({ success: true, message });

    } catch (error) {
        console.error(error); // Log the error for debugging
        res.json({ success: false, message: error.message });
    }
}