import express from 'express';
import { auth } from '../middleware/auth.js'; 
import multer from 'multer';
import {
    generateArticle, generateBlogTitle, generateImage,
    removeImageBackground, removeImageObject, resumeReview
} from '../controllers/aiController.js';

const aiRouter = express.Router();

// Memory storage is best for serverless/cloud environments
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Text Generation Routes
aiRouter.post('/generate-article', auth, generateArticle);
aiRouter.post('/generate-blog-title', auth, generateBlogTitle);
aiRouter.post('/generate-image', auth, generateImage);


// ⚡️ FIXED: Move 'auth' BEFORE 'upload.single' so the user is authenticated first!
aiRouter.post('/remove-image-background', auth, upload.single('image'), removeImageBackground);
aiRouter.post('/remove-image-object', auth, upload.single('image'), removeImageObject);
aiRouter.post('/review-resume', auth, upload.single('resume'), resumeReview);

export default aiRouter;