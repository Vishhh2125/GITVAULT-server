import mongoose from "mongoose";

const PATSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  tokenHash: {
    type: String,
    required: true,
    unique: true,
  },
  label: {
    type: String,
    default: "New Token",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  expiresAt: {
    type: Date,
    required: true,
  },
});



const PAT = mongoose.model("PAT", PATSchema);

export default PAT;
