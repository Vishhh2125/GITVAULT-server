import express from "express";
import morgan from "morgan";
import cookieParser from "cookie-parser";
const app = express();

app.use(express.json());
app.use(morgan("dev"));
app.use(cookieParser());












import repoRouter from "./routes/repo.route.js";
import userRouter from "./routes/user.route.js";

app.use("/api/v1/users",userRouter);

app.use("/api/v1/repos",repoRouter);








export default app;