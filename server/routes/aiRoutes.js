import express from 'express';
import { auth } from '../middleware/auth.js'; 
import multer from 'multer';
import {
    generateArticle, generateBlogTitle, generateImage,
    removeImageBackground, removeImageObject, resumeReview
} from '../controllers/aiController.js';

const aiRouter = express.Router();

// Initialize Multer
const upload = multer({ dest: 'uploads/' }); // This creates a 'path' property

aiRouter.post('/generate-article', auth, generateArticle);
aiRouter.post('/generate-blog-title', auth, generateBlogTitle);
aiRouter.post('/generate-image', auth, generateImage);
aiRouter.post('/remove-image-background', upload.single('image'), auth, removeImageBackground);
aiRouter.post('/remove-image-object', upload.single('image'), auth, removeImageObject);
aiRouter.post('/review-resume', upload.single('resume'), auth, resumeReview);

export default aiRouter;