import express from 'express';
import {getAllRepos,createRepo,getRepoByUser,getRepoInfo,updateRepo,deleteRepo} from "../controllers/repo.controller.js";
import verifyJWT from '../middleware/authMiddleware.js';
import { addCollaborator,getAllUserCollaboratorRepos } from '../controllers/collaborator.controller.js';

const router = express.Router();

//api routes will be added here

router.route("/create").post(verifyJWT,createRepo)
router.route("/all").get(verifyJWT,getAllRepos)//all repos
router.route("/my").get(verifyJWT,getRepoByUser) //all repo for user 
router.route("/:id").get(verifyJWT, getRepoInfo)   //get specific repo by id
router.route("/:id").put(verifyJWT, updateRepo)   //update repo
router.route("/:id").delete(verifyJWT, deleteRepo)   //delete repo
router.route("/collaborators/my").get(verifyJWT,getAllUserCollaboratorRepos)  //get all repo were the user is colloborator
//colloborator routes 

//file sysytem routes will be added here




export default router;
