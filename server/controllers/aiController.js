import OpenAI from "openai";
import sql from "../config/db.js";
import axios from 'axios'
import { v2 as cloudinary } from 'cloudinary'
import fs from 'node:fs';
import { PassThrough } from 'stream';
import pdfParser from 'pdf-parse-fork';
import { getAuth } from '@clerk/express';

// ⚡️ FIXED: Correct baseURL configuration format for Gemini's OpenAI Compatibility Layer
const AI = new OpenAI({
    apiKey: process.env.GEMINI_API_KEY,
    baseURL: "https://generativelanguage.googleapis.com/v1beta/"
});

// API TO GENERATE ARTICLE
export const generateArticle = async (req, res) => {
    try {
        // 1. Unpack the ID from all possible middleware locations safely
        const rawUserId = req.clerkId || req.userId || getAuth(req).userId;

        if (!rawUserId || typeof rawUserId === 'object') {
            console.error("Database block prevented: invalid userId layout received:", rawUserId);
            return res.json({
                success: false,
                message: "Authentication sync error. Please refresh the page and try again."
            });
        }

        const userId = String(rawUserId).trim(); 
        const { prompt, length } = req.body;

        if (!prompt) {
            return res.json({ success: false, message: "Prompt is required" });
        }

        // 2. Execute usage check query
        const usageResult = await sql`
            SELECT COUNT(*)::int AS count
            FROM creations
            WHERE user_id = ${userId}
        `;
        
        // ⚡️ FIX 1: Extract the actual count integer safely from the database row array
        const articlesGenerated = usageResult[0]?.count || 0;
        const limit = 5; // Define your tier limit here (e.g., 5 articles max)

        if (articlesGenerated >= limit) {
            return res.json({
                success: false,
                message: "You have reached your free tier generation limit!"
            });
        }

        // ⚡️ FIX 2: Your actual AI generation logic needs to run here to define 'content'
        // Example placeholder (replace with your actual Google Gen AI / OpenAI SDK invocation script):
        // const content = await generateAIContentStreamOrText(prompt, length);
        const content = `This is a placeholder article body text generated about ${prompt}.`; 

        // 3. Log the creation in your table so the count increments on the next call
        await sql`
            INSERT INTO creations (user_id, prompt, type)
            VALUES (${userId}, ${prompt}, 'article')
        `;

        // STEP 4: Return usage info cleanly to your frontend layout
        res.json({
            success: true,
            content,
            usage: {
                used: articlesGenerated + 1,
                limit,
                remaining: limit - (articlesGenerated + 1)
            }
        });

    // ... your main controller logic above

    } catch (error) {
        // ⚡️ CHANGE THIS LINE: Print the full error object directly 
        // to see the exact file line number that is failing!
        console.log("❌ DETAILED BACKEND CRASH LOG:", error);
        
        res.json({
            success: false,
            message: error.message || "An unexpected controller reference error occurred."
        });
    }
};

// API TO GENERATE BLOG TITLE
export const generateBlogTitle = async (req, res) => {
    try {
        const userId = req.clerkId || req.userId || getAuth(req).userId;
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
        const response = await AI.chat.completions.create({
            model: "gemini-2.5-flash",
            messages: [
                { role: "user", content: prompt }
            ],
            temperature: 0.7,
            max_tokens: 500
        });

        const content = response?.choices?.[0]?.message?.content || "";

        if (!content) {
            return res.json({
                success: false,
                message: "AI failed to generate content"
            });
        }

        // STEP 3: save creation 
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
        const userId = req.clerkId || req.userId || getAuth(req).userId; 
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

        // STEP 2: Fetch image stream from ClipDrop 
        const formData = new FormData();
        formData.append('prompt', prompt);

        const clipdropResponse = await axios.post('https://clipdrop-api.co/text-to-image/v1', formData, {
            headers: { 'x-api-key': process.env.CLIPDROP_API_KEY },
            responseType: "stream", 
        });

        // Stream the bytes directly into Cloudinary's upload pipeline
        const cloudinaryUpload = () => {
            return new Promise((resolve, reject) => {
                const uploadStream = cloudinary.uploader.upload_stream(
                    { folder: "creations" },
                    (error, result) => {
                        if (error) return reject(error);
                        resolve(result);
                    }
                );
                clipdropResponse.data.pipe(uploadStream);
            });
        };

        const uploadResponse = await cloudinaryUpload();
        const secure_url = uploadResponse.secure_url;

        if (!secure_url) {
            throw new Error("Cloudinary upload failed");
        }

        // STEP 3: Save creation
        const isPublished = publish === true || publish === 'true';

        await sql`
            INSERT INTO creations (user_id, prompt, content, type, publish) 
            VALUES (${userId}, ${prompt}, ${secure_url}, 'image', ${isPublished})
        `;

        // STEP 4: Return result
        return res.json({
            success: true,
            content: secure_url
        });

    } catch (error) {
        console.error("GENERATE IMAGE ERROR:", error.message);
        return res.status(500).json({
            success: false,
            message: "Image generation or storage failed"
        });
    }
};

// API TO REMOVE BACKGROUND
export const removeImageBackground = async (req, res) => {
    try {
        const userId = req.clerkId || req.userId || getAuth(req).userId;
        if (!userId) {
            return res.status(401).json({ success: false, message: "User not authenticated" });
        }

        if (!req.file) {
            return res.status(400).json({ success: false, message: "No image uploaded" });
        }

        const base64Image = Buffer.from(req.file.buffer).toString('base64');
        const dataURI = `data:${req.file.mimetype};base64,${base64Image}`;

        const uploadResponse = await cloudinary.uploader.upload(dataURI, {
            folder: 'creations',
        });

        const secure_url = uploadResponse.secure_url;

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
        const userId = req.clerkId || req.userId || getAuth(req).userId;
        const { object } = req.body; 
        const file = req.file;

        if (!file) {
            return res.status(400).json({ success: false, message: "No image uploaded" });
        }

        const base64Image = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;

        const result = await cloudinary.uploader.upload(base64Image, {
            transformation: [
                { effect: `gen_remove:prompt_${object}` }
            ]
        });

        await sql`INSERT INTO creations (user_id, prompt, content, type) 
                  VALUES (${userId}, ${`Remove ${object}`}, ${result.secure_url}, 'image')`;

        res.json({ success: true, content: result.secure_url });

    } catch (error) {
        console.error("AI Controller Error:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

// resume review api
export const resumeReview = async (req, res) => {
    try {
        const userId = req.clerkId || req.userId || getAuth(req).userId;
        const resumeFile = req.file;

        if (!resumeFile) return res.json({ success: false, message: "No file" });

        const dataBuffer = resumeFile.buffer;
        const pdfData = await pdfParser(dataBuffer);
        const extractedText = pdfData.text;

        if (!extractedText || extractedText.length < 10) {
            return res.json({ success: false, message: "Could not read PDF" });
        }

        const response = await AI.chat.completions.create({
            model: "gemini-2.5-flash",
            messages: [
                {
                    role: "user",
                    content: `Review this resume and provide feedback: ${extractedText}`
                }
            ],
            temperature: 0.7,
        });

        const content = response?.choices?.[0]?.message?.content || "";

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