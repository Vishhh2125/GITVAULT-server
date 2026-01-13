import { Router } from "express";
import verifyJWT from "../middleware/authMiddleware.js";
import { addCollaborator, getCollaboratorsDetails, updateCollaboratorRole, deleteCollaborator } from '../controllers/collaborator.controller.js';

const router = Router();

router.route("/:repoId/collaborators/add").post(verifyJWT, addCollaborator);  //add collaborator
router.route("/:repoId/collaborators/get").get(verifyJWT, getCollaboratorsDetails);  //get collaborators
router.route("/:repoId/collaborators/:collaboratorId/role").put(verifyJWT, updateCollaboratorRole);  //update collaborator role
router.route("/:repoId/collaborators/:collaboratorId").delete(verifyJWT, deleteCollaborator);  //delete collaborator

export default router;


