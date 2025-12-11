import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import PAT from "../models/pat.model.js";
import bcrypt from "bcrypt";
import crypto from "crypto";



const createPAT = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const { label } = req.body || {};

  // Generate raw PAT → shown once
  const rawToken = crypto.randomBytes(32).toString("hex");

  // Hash token
  const hashedToken = await bcrypt.hash(rawToken, 10);

  // Expiry (30 days)
  const expiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  // Save PAT
  const newToken = await PAT.create({
    userId,
    tokenHash: hashedToken,
    label: label || "New Token",
    expiresAt: expiry,
  });

  return res.status(201).json(new ApiResponse(201, {
      id: newToken._id,
      label: newToken.label,
      expiresAt: newToken.expiresAt,
      token: rawToken,
    }, "PAT generated successfully"))
});




const deletePAT = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { patId } = req.params;

  const pat = await PAT.findOneAndDelete({
    _id: patId,
    userId,
  });

  if (!pat) {
    return res.status(404).json({
      success: false,
      message: "PAT not found",
    });
  }

  return res.status(200).json(new ApiResponse(200,"","PAT deleted successsfully"));
});





const listUserPATs = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const tokens = await PAT.find({ userId })
    .select("label createdAt expiresAt");

  return res.status(200).json(new ApiResponse(200,tokens,"User PATs fetched successfully"));
});





export { createPAT, deletePAT,listUserPATs };




