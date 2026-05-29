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
// file: /server/controllers/aiController.js

export const generateArticle = async (req, res) => {
  try {
    const { prompt, length } = req.body;
    const userId = req.clerkId || req.userId || getAuth(req).userId;

    if (!prompt) {
      return res.json({ success: false, message: "Prompt is required" });
    }

    // 1. Fetch completion from Gemini's OpenAI Layer
    const response = await AI.chat.completions.create({
      model: "gemini-2.5-flash",
      messages: [
        { 
          role: "user", 
          content: `${prompt}. Keep the length around ${length || 500} words.` 
        }
      ],
      temperature: 0.7,
    });

    const generatedContent = response?.choices?.[0]?.message?.content || "";

    if (!generatedContent) {
      return res.json({ success: false, message: "AI failed to return content." });
    }

    // 2. Safe Database Insertion using your verified 'sql' schema connection
    const result = await sql`
      INSERT INTO creations (user_id, prompt, content, type)
      VALUES (${userId}, ${prompt}, ${generatedContent}, 'article')
      RETURNING *
    `;

    // 3. ✅ UNIFIED RESPONSE MATCHING FRONTEND EXPECTATIONS:
    // This feeds 'data.content' directly into your state setter!
    return res.status(200).json({
       success: true,
       content: result[0]?.content || generatedContent
    });

  } catch (error) {
        console.error("AI Generation Error Details:", error);

        // Capture upstream API rate limits or quota failures explicitly
        if (error.status === 429 || error.statusCode === 429) {
            return res.status(429).json({
                success: false,
                message: "Your AI API key has hit its rate limit or your balance has run out. Check your AI provider billing panel."
            });
        }

        return res.status(500).json({
            success: false,
            message: error.message || "Internal Server Error during article generation"
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

        // Step 1: Upload original image
        const uploadResponse = await cloudinary.uploader.upload(dataURI, {
            folder: 'creations',
            format: 'png'
        });

        const publicId = uploadResponse.public_id;

        // Step 2: Trigger background removal and poll
        await cloudinary.uploader.explicit(publicId, {
            type: 'upload',
            background_removal: 'cloudinary_ai',
        });

        // Step 3: Poll until done
        let finalUrl = null;
        for (let i = 0; i < 15; i++) {
            await new Promise(resolve => setTimeout(resolve, 3000));

            const result = await cloudinary.api.resource(publicId, { format: 'png' });
            const status = result.info?.background_removal?.cloudinary_ai?.status;

            console.log(`Attempt ${i + 1}: status = ${status}`); // helpful for debugging

            if (status === 'complete') {
                // ✅ Build a fresh delivery URL with cache-busting transformation
                finalUrl = cloudinary.url(publicId, {
                    format: 'png',
                    version: result.version, // version forces CDN to serve the latest asset
                    sign_url: true,
                });
                break;
            }

            if (status === 'failed') {
                return res.status(500).json({ success: false, message: "Background removal failed on Cloudinary's end" });
            }
        }

        if (!finalUrl) {
            return res.status(500).json({ success: false, message: "Background removal timed out" });
        }

        await sql`INSERT INTO creations (user_id, prompt, content, type) 
                  VALUES (${userId}, 'Remove Background', ${finalUrl}, 'image')`;

        res.json({ success: true, content: finalUrl });

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
            role: "system",
            content: `You are an expert resume reviewer. Today's date is ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}. 
Review resumes based on current ${new Date().getFullYear()} standards. 
Never question or correct dates, years, or experiences mentioned in the resume — take all information at face value.`
        },
        {
            role: "user",
            content: `Review this resume and provide detailed feedback:\n\n${extractedText}`
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