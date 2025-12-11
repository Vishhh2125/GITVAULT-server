import express from 'express';
import {getAllRepos,createRepo,getRepoByUser,getRepoInfo} from "../controllers/repo.controller.js";
import verifyJWT from '../middleware/authMiddleware.js';
import { addCollaborator } from '../controllers/collaborator.controller.js';

const router = express.Router();


//api routes will be added here

router.route("/create").post(verifyJWT,createRepo)
router.route("/all").get(verifyJWT,getAllRepos)//all repos
router.route("/my").get(verifyJWT,getRepoByUser) //all repo for user 
router.route("/:id").get(getRepoInfo)   //any s[pecific repo ae per its id  

//colloborator routes
router.route("/:repoId/collaborators/add").post(addCollaborator);




export default router;
