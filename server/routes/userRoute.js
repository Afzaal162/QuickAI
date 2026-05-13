import express from 'express';
import {auth} from '../middleware/auth.js'
import {getUserCreation, getPublishedCreation,toggleLikeCreation} from '../controllers/userController.js'
const userRouter = express.Router();
userRouter.get('/get-user-creation',auth,getUserCreation);
userRouter.get('/get-published-creation',auth,getPublishedCreation);
userRouter.post('/get-toggle-like',auth,toggleLikeCreation);


export default userRouter;