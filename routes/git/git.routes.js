import { Router } from "express";
import gitAuth from "../../middleware/gitAuth.js";
import gitAuthorize from "../../middleware/gitAuthorize.js";
import {
  handleInfoRefs,
  handleUploadPack,
  handleReceivePack,
} from "../../controllers/git/git.controller.js";

const router = Router();

// Git Smart HTTP routes
// gitAuth → validates PAT token
// gitAuthorize → checks repo permissions
router
  .route("/:username/:repo.git/info/refs")
  .get(gitAuth, gitAuthorize, handleInfoRefs);

router
  .route("/:username/:repo.git/git-upload-pack")
  .post(gitAuth, gitAuthorize, handleUploadPack);

router
  .route("/:username/:repo.git/git-receive-pack")
  .post(gitAuth, gitAuthorize, handleReceivePack);

export default router;
