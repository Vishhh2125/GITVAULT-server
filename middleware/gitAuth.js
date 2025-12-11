import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import PAT from "../models/pat.model.js";
import bcrypt from "bcrypt";

// Middleware to authenticate Git CLI requests using PAT
const gitAuth = asyncHandler(async (req, res, next) => {
  console.log("🔥 Incoming Git request:");
  console.log("URL:", req.originalUrl);
  console.log("Headers:", req.headers);
  
  const authHeader = req.headers.authorization;

  // If no auth header, send 401 with WWW-Authenticate to prompt Git CLI
  if (!authHeader || !authHeader.startsWith("Basic ")) {
    res.setHeader('WWW-Authenticate', 'Basic realm="Git"');
    throw new ApiError(401, "Authorization required for Git operations");
  }

  // Decode Basic Auth (format: "Basic base64(username:token)")
  const base64Credentials = authHeader.split(" ")[1];
  const credentials = Buffer.from(base64Credentials, "base64").toString("ascii");
  const [username, token] = credentials.split(":");

  if (!token) {
    res.setHeader('WWW-Authenticate', 'Basic realm="Git"');
    throw new ApiError(401, "Invalid authorization format");
  }

  // Find all PATs for validation
  const pats = await PAT.find({ expiresAt: { $gt: new Date() } }).populate("userId");

  let authenticatedUser = null;

  // Check token against all stored PAT hashes
  for (const pat of pats) {
    const isValid = await bcrypt.compare(token, pat.tokenHash);
    if (isValid) {
      authenticatedUser = pat.userId;
      break;
    }
  }

  if (!authenticatedUser) {
    res.setHeader('WWW-Authenticate', 'Basic realm="Git"');
    throw new ApiError(401, "Invalid or expired token");
  }

  // Attach user to request
  req.user = authenticatedUser;
  next();
});

export default gitAuth;