import OpenAI from "openai";
import sql from "../config/db.js";
import axios from 'axios'
import { v2 as cloudinary } from 'cloudinary'
import fs from 'node:fs';
import pdfParser from 'pdf-parse-fork';
import { getAuth } from '@clerk/express';
const AI = new OpenAI({
    apiKey: process.env.GEMINI_API_KEY,
    baseURL: "https://generativelanguage.googleapis.com/v1beta/openai"
});
// API TO GENERATE ARTICLE
export const generateArticle = async (req, res) => {
    try {

        const userId = req.userId;
        const { prompt, length } = req.body;

        if (!prompt) {
            return res.json({
                success: false,
                message: "Prompt is required"
            });
        }

        // STEP 1: check usage BEFORE AI call
        const usageResult = await sql`
            SELECT COUNT(*)::int AS count
            FROM creations
            WHERE user_id = ${userId}
        `;

        const articlesGenerated = usageResult[0].count;

        const limit = 10;

        if (articlesGenerated >= limit) {
            return res.json({
                success: false,
                message: "Free limit reached. Upgrade required."
            });
        }

        // STEP 2: AI generation
        const response = await AI.chat.completions.create({
            model: "gemini-3-flash-preview",
            messages: [
                {
                    role: "user",
                    content: prompt
                }
            ],
            temperature: 0.7,
            max_tokens: Math.min((length || 800) * 2, 4000)
        });

        const content = response?.choices?.[0]?.message?.content || "";

        if (!content) {
            return res.json({
                success: false,
                message: "AI failed to generate content"
            });
        }

        // STEP 3: save creation (this increments usage indirectly)
        await sql`
            INSERT INTO creations (user_id, prompt, content, type)
            VALUES (${userId}, ${prompt}, ${content}, 'article')
        `;

        // STEP 4: return usage info
        res.json({
            success: true,
            content,
            usage: {
                used: articlesGenerated + 1,
                limit,
                remaining: limit - (articlesGenerated + 1)
            }
        });

    } catch (error) {
        console.log("ERROR:", error.message);

        res.json({
            success: false,
            message: error.message
        });
    }
};
// API TO GENERATE BLOG TITLE
export const generateBlogTitle = async (req, res) => {
    try {

        const userId = req.userId;
        const { prompt } = req.body;

        if (!prompt) {
            return res.json({
                success: false,
                message: "Prompt is required"
            });
        }

        // STEP 1: check usage BEFORE AI call
        const usageResult = await sql`
            SELECT COUNT(*)::int AS count
            FROM creations
            WHERE user_id = ${userId}
        `;

        const articlesGenerated = usageResult[0].count;

        const limit = 10;

        if (articlesGenerated >= limit) {
            return res.json({
                success: false,
                message: "Free limit reached. Upgrade required."
            });
        }

        // STEP 2: AI generation
        // STEP 2: AI generation
        const response = await AI.chat.completions.create({
            model: "gemini-3-flash-preview",
            messages: [
                { role: "user", content: prompt }
            ],
            temperature: 0.7,
            // Change this line:
            max_tokens: 500 // Blog titles are short, 200 is plenty
        });

        const content = response?.choices?.[0]?.message?.content || "";

        if (!content) {
            return res.json({
                success: false,
                message: "AI failed to generate content"
            });
        }

        // STEP 3: save creation (this increments usage indirectly)
        await sql`
            INSERT INTO creations (user_id, prompt, content, type)
            VALUES (${userId}, ${prompt}, ${content}, 'blog-title')
        `;

        // STEP 4: return usage info
        res.json({
            success: true,
            content,
            usage: {
                used: articlesGenerated + 1,
                limit,
                remaining: limit - (articlesGenerated + 1)
            }
        });

    } catch (error) {
        console.log("ERROR:", error.message);

        res.json({
            success: false,
            message: error.message
        });
    }
};
// API TO GENERATE IMAGE
export const generateImage = async (req, res) => {
    try {
        const userId = req.userId;
        const { prompt, publish } = req.body;

        if (!prompt) {
            return res.status(400).json({ success: false, message: "Prompt is required" });
        }

        // STEP 1: Check usage
        const usageResult = await sql`
            SELECT COUNT(*)::int AS count
            FROM creations
            WHERE user_id = ${userId}
        `;

        if (usageResult[0].count >= 10) {
            return res.status(403).json({ success: false, message: "Free limit reached." });
        }

        // STEP 2: AI generation (Text-to-Image)
        const formData = new FormData();
        formData.append('prompt', prompt);

        const { data } = await axios.post('https://clipdrop-api.co/text-to-image/v1', formData, {
            headers: { 'x-api-key': process.env.CLIPDROP_API_KEY },
            responseType: "arraybuffer",
        });

        // Convert and upload to Cloudinary
        const base64Image = `data:image/png;base64,${Buffer.from(data, 'binary').toString('base64')}`;
        const uploadResponse = await cloudinary.uploader.upload(base64Image);
        const secure_url = uploadResponse.secure_url;

        if (!secure_url) {
            throw new Error("Cloudinary upload failed");
        }

        // STEP 3: Save creation (Fixed column list to include 'published')
     // Force a strict boolean conversion
const isPublished = publish === true || publish === 'true';

await sql`
    INSERT INTO creations (user_id, prompt, content, type, publish) 
    VALUES (${userId}, ${prompt}, ${secure_url}, 'image', ${isPublished})
`;

        // STEP 4: Return result
        res.json({
            success: true,
            content: secure_url
        });

    } catch (error) {
        console.error("GENERATE IMAGE ERROR:", error.response?.data || error.message);
        res.status(error.response?.status || 500).json({
            success: false,
            message: error.message
        });
    }
};
// API TO REMOVE BACKGROUND
export const removeImageBackground = async (req, res) => {
    try {
        const { userId } = getAuth(req);
        if (!userId) {
            return res.status(401).json({ success: false, message: "User not authenticated" });
        }

        // 1. Check if the file exists (Multer puts it in req.file)
        if (!req.file) {
            return res.status(400).json({ success: false, message: "No image uploaded" });
        }

        // 2. Convert buffer to Base64 so Cloudinary can read it
        const base64Image = Buffer.from(req.file.buffer).toString('base64');
        const dataURI = `data:${req.file.mimetype};base64,${base64Image}`;

        // 3. Upload to Cloudinary
        // (Make sure you've imported 'cloudinary' at the top of your file!)
        const uploadResponse = await cloudinary.uploader.upload(dataURI, {
            folder: 'creations',
        });

        const secure_url = uploadResponse.secure_url; 

        // 4. Insert into Database
        await sql`INSERT INTO creations (user_id, prompt, content, type) 
                  VALUES (${userId}, 'Remove Background', ${secure_url}, 'image')`;

        res.json({ success: true, content: secure_url });

    } catch (error) {
        console.error("BG REMOVAL ERROR:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};
// Remove Imageobject
export const removeImageObject = async (req, res) => {
    try {
        const { userId } = req.auth; // Ensure this matches your auth logic
        const { object } = req.body; // The word you want to remove
        const file = req.file;

        if (!file) {
            return res.status(400).json({ success: false, message: "No image uploaded" });
        }

        // 1. Convert the buffer to a Base64 string
        const base64Image = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;

        // 2. Call Cloudinary using the base64 string
        const result = await cloudinary.uploader.upload(base64Image, {
            // Using Cloudinary's Generative AI to remove the specific object
            transformation: [
                { effect: `gen_remove:prompt_${object}` }
            ]
        });

        // 3. Save to database and return
        // ... (Your sql insert logic)

        res.json({ success: true, content: result.secure_url });

    } catch (error) {
        console.error("AI Controller Error:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};
// resume review api
export const resumeReview = async (req, res) => {
    try {
        const { userId } = getAuth(req);
        const resumeFile = req.file;

        if (!resumeFile) return res.json({ success: false, message: "No file" });

        // --- RE-ADD YOUR EXTRACTION LOGIC HERE ---
        const dataBuffer = resumeFile.buffer;
        const pdfData = await pdfParser(dataBuffer);
        const extractedText = pdfData.text;

        console.log("--- STARTING AI CALL ---");
        console.log("Text Length:", extractedText?.length);

        if (!extractedText || extractedText.length < 10) {
            return res.json({ success: false, message: "Could not read PDF" });
        }

        // --- MATCH THE ARTICLE MODULE EXACTLY ---
        const response = await AI.chat.completions.create({
            model: "gemini-3-flash-preview", // Use the EXACT string from your Article module
            messages: [
                {
                    role: "user",
                    content: `Review this resume and provide feedback: ${extractedText}`
                }
            ],
            temperature: 0.7,
        });

        const content = response?.choices?.[0]?.message?.content || "";

        // Save to DB
        // Make sure this matches the columns your database expects
await sql`
    INSERT INTO creations (user_id, prompt, content, type) 
    VALUES (${userId}, 'Resume Review Analysis', ${content}, 'resume-review')
`;

        res.json({ success: true, content });

    } catch (error) {
        console.log("RESUME ERROR:", error.message);
        res.json({ success: false, message: error.message });
    }
};