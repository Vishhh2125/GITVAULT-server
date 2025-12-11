import { Router } from "express";
import gitAuth from "../../middleware/gitAuth.js";
import {
  handleInfoRefs,
  handleUploadPack,
  handleReceivePack,
} from "../../controllers/git/git.controller.js";

const router = Router();

// Git Smart HTTP routes
router
  .route("/:username/:repo.git/info/refs")
  .get(gitAuth, handleInfoRefs);

router
  .route("/:username/:repo.git/git-upload-pack")
  .post(gitAuth, handleUploadPack);

router
  .route("/:username/:repo.git/git-receive-pack")
  .post(gitAuth, handleReceivePack);

export default router;
