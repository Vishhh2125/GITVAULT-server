import {Router}  from 'express';
import { registerUser,loginUser,logoutUser,refreshAccessToken,changePassword } from '../controllers/user.controller.js';
import verifyJWT from '../middleware/authMiddleware.js';

const router = Router();

router.route("/register").post(registerUser)
router.route("/login").post(loginUser)
router.route("/refresh-accessToken").post(refreshAccessToken)
router.route("/logout").post(verifyJWT,logoutUser)
router.route("/change-password").put(verifyJWT,changePassword)

export default router;