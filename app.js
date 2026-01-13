import express from "express";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import cors from 'cors';
const app = express();

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(morgan("dev"));
app.use(cookieParser());











//restApi routes 
import repoRouter from "./routes/repo.route.js";
import userRouter from "./routes/user.route.js";
import patRouter from "./routes/pat.route.js";
import repoFileRouter from "./routes/repofile.route.js";
import { errorHandler } from "./middleware/errorHandler.js";
import collaboratorRouter from "./routes/collaborator.route.js";
app.use("/api/v1/repos",collaboratorRouter);
app.use("/api/v1/users",userRouter);
app.use("/api/v1/repos",repoRouter);
app.use("/api/v1/repos",repoFileRouter);
app.use("/api/v1/pat",patRouter);

// git smart HTTP routes
import gitRouter from "./routes/git/git.routes.js";
app.use("/git",gitRouter);

// Error handler middleware mut be at teh end after all routes
app.use(errorHandler);







export default app;