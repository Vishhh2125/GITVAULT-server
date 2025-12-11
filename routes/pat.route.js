import { Router } from "express";
import verifyJWT from "../middleware/authMiddleware.js";
import {createPAT,deletePAT,listUserPATs} from "../controllers/pat.controller.js";
const router = Router();



router.route("/create").post(verifyJWT,createPAT);
router.route("/:patId").delete(verifyJWT,deletePAT);
router.route("/myPats").get(verifyJWT,listUserPATs);





export default router;