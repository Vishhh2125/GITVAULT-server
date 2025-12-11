import express from "express";
import morgan from "morgan";
import cookieParser from "cookie-parser";
const app = express();

app.use(express.json());
app.use(morgan("dev"));
app.use(cookieParser());











//restApi routes 
import repoRouter from "./routes/repo.route.js";
import userRouter from "./routes/user.route.js";
import patRouter from "./routes/pat.route.js";


app.use("/api/v1/users",userRouter);

app.use("/api/v1/repos",repoRouter);

app.use("/api/v1/pat",patRouter);



// git smart HTTP routes
import gitRouter from "./routes/git/git.routes.js";
app.use("/git",gitRouter);







export default app;