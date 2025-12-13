import express from 'express';
import {getAllRepos,createRepo,getRepoByUser,getRepoInfo} from "../controllers/repo.controller.js";
import verifyJWT from '../middleware/authMiddleware.js';
import { addCollaborator,getAllUserCollaboratorRepos } from '../controllers/collaborator.controller.js';

const router = express.Router();


//api routes will be added here

router.route("/create").post(verifyJWT,createRepo)
router.route("/all").get(verifyJWT,getAllRepos)//all repos
router.route("/my").get(verifyJWT,getRepoByUser) //all repo for user 
router.route("/:id").get(getRepoInfo)   //any s[pecific repo ae per its id  
 router.route("/collaborators/my").get(verifyJWT,getAllUserCollaboratorRepos)  //get all repo were the user is colloborator
//colloborator routes 

router.route("/:repoId/collaborators/add").post(verifyJWT,addCollaborator);  //add colooborator





export default router;
