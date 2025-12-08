import express from "express";



const app = express();

app.use(express.json());














import repoRouter from "./routes/repo.router.js";
import userRouter from "./routes/user.router.js";

app.use("/api/v1/users",userRouter);

app.use("/api/v1/repos",repoRouter);








export default app;