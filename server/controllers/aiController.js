import OpenAI from "openai";
import sql from "../config/db.js";
import axios from 'axios'
import { v2 as cloudinary } from 'cloudinary'
import fs from 'node:fs';
import pdfParser from 'pdf-parse-fork';
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
        const userId = req.userId;

        // 1. Grab the file object directly from Multer
        const file = req.file;

        // 2. Add this debug log! If this says "undefined", the issue is Multer or Middleware order.
        console.log("File received:", file);

        if (!file) {
            return res.status(400).json({ success: false, message: "No file uploaded" });
        }

        // 3. Check Usage
        const usageResult = await sql`SELECT COUNT(*)::int AS count FROM creations WHERE user_id = ${userId}`;
        if (usageResult[0].count >= 10) {
            return res.status(403).json({ success: false, message: "Limit reached" });
        }

        // 4. Upload to Cloudinary (Use file.path)
        const uploadResponse = await cloudinary.uploader.upload(file.path, {
            transformation: [{ effect: 'background_removal' }]
        });

        const secure_url = uploadResponse.secure_url;

        // 5. Save to DB
        await sql`INSERT INTO creations (user_id, prompt, content, type) 
                  VALUES (${userId}, 'Remove Background', ${secure_url}, 'image')`;

        res.json({ success: true, content: secure_url });

    } catch (error) {
        console.error("BACKEND CRASH:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};
// Remove Imageobject
export const removeImageObject = async (req, res) => {
    try {
        const userId = req.userId;
        const { object } = req.body; // Text field
        const file = req.file;       // File object from Multer

        // 1. Safety Check: If Multer failed to grab the file
        if (!file) {
            return res.status(400).json({ success: false, message: "No image file received" });
        }

        // 2. Check usage... (your SQL logic)

        // 3. Upload with FIXED transformation string
        // Note: It must be 'gen_remove:prompt_' followed by your object name
        const uploadResponse = await cloudinary.uploader.upload(file.path, {
            transformation: [
                { effect: `gen_remove:prompt_${object}` }
            ]
        });

        // 4. Use the correct response variable
        const secure_url = uploadResponse.secure_url;

        // 5. Save to DB and Return
        await sql`INSERT INTO creations (user_id, prompt, content, type) 
                  VALUES (${userId}, ${object}, ${secure_url}, 'remove-object')`;

        res.json({ success: true, content: secure_url });

    } catch (error) {
        // This will print the EXACT reason for the 500 error in your terminal
        console.error("DETAILED BACKEND ERROR:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};


export const resumeReview = async (req, res) => {
    try {
        const userId = req.userId;
        const resumeFile = req.file;

        // 1. Validate File Upload
        if (!resumeFile) {
            return res.status(400).json({ success: false, message: "No resume file uploaded." });
        }

        // 2. Check Usage Limit
        const usageResult = await sql`
            SELECT COUNT(*)::int AS count
            FROM creations
            WHERE user_id = ${userId}
        `;

        if (usageResult[0].count >= 10) {
            return res.status(403).json({ success: false, message: "Free limit reached." });
        }

        // 3. Extract Text from PDF
        const dataBuffer = fs.readFileSync(resumeFile.path);
        let extractedText = "";

        // Determine which parser function to use
        const parser = (typeof pdfParser === 'function') ? pdfParser : pdfParser.default;

        if (typeof parser === 'function') {
            const pdfData = await parser(dataBuffer);
            extractedText = pdfData.text;
        } else {
            // "Emergency" fallback: force a require if the import is being difficult
            const { createRequire } = await import('module');
            const require = createRequire(import.meta.url);
            const altParser = require('pdf-parse');
            const pdfData = await altParser(dataBuffer);
            extractedText = pdfData.text;
        }

        // 4. Validate Extracted Content
        if (!extractedText || extractedText.trim().length < 50) {
            return res.status(400).json({
                success: false,
                message: "Could not extract enough text from the PDF. Please ensure it's not a scanned image."
            });
        }

        // 5. AI Generation
        const response = await AI.chat.completions.create({
            model: "gemini-3-flash-preview",
            messages: [
                {
                    role: "system",
                    content: "You are an expert HR manager. Provide a detailed review of the following resume text, highlighting strengths, weaknesses, and specific areas for improvement."
                },
                { role: "user", content: extractedText }
            ],
            temperature: 0.7,
            max_tokens: 2000
        });

        const content = response?.choices?.[0]?.message?.content || "";

        // 6. Save Record to Database
        await sql`
            INSERT INTO creations (user_id, prompt, content, type) 
            VALUES (${userId}, 'Resume Review Analysis', ${content}, 'resume-review')
        `;

        // 7. Final Success Response
        res.json({
            success: true,
            content
        });

    } catch (error) {
        console.error("RESUME REVIEW CRASH:", error);
        res.status(500).json({
            success: false,
            message: error.message || "An internal error occurred during the review."
        });
    }
};