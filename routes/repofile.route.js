import express from 'express';
const router = express.Router();
import { getRepoTree, getFileContent } from '../controllers/repofile.controller.js';
import authMiddleware from '../middleware/authMiddleware.js';

// Get repository tree (folders and files)
router.get('/:repoId/tree', authMiddleware, getRepoTree);

// Get file content
router.get('/:repoId/file', authMiddleware, getFileContent);

export default router;
