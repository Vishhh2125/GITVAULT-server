import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { infoRefsService } from "../../services/git/infoRefsService.js";
import { uploadPackService } from "../../services/git/uploadPackService.js";
import { receivePackService } from "../../services/git/receivePackService.js";

const handleInfoRefs = asyncHandler(async (req, res) => {
  const { username, repo } = req.params;
  const service = req.query.service; // git-upload-pack or git-receive-pack

  if (!service) {
    throw new ApiError(400, "service query parameter is required");
  }

  // Build path to repo
  const repoPath = `./repos/${username}/${repo}.git`;

  // Call service
  await infoRefsService(repoPath, service,req, res);
});

//uploda pack controller 

const handleUploadPack = asyncHandler(async (req, res) => {
  const { username, repo } = req.params;
  const repoPath = `./repos/${username}/${repo}.git`;
  await uploadPackService(repoPath, req, res);
});

const handleReceivePack = asyncHandler(async (req, res) => {
  const { username, repo } = req.params;
  const repoPath = `./repos/${username}/${repo}.git`;
  await receivePackService(repoPath, req, res);
});

export { handleInfoRefs, handleUploadPack, handleReceivePack };