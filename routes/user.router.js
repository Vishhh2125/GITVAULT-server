import {Router}  from 'express';
import { registerUser,loginUser } from '../controllers/userController.js';
import verifyJWT from '../middleware/authMiddleware.js';

const router = Router();



router.route("/register").post(verifyJWT, registerUser)
router.route("/login").post(loginUser)


export default router;