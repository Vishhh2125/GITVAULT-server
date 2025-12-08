import connectDB from "./Db/index.js";
import app from "./app.js";

const PORT = process.env.PORT || 8080;

connectDB()
 .then(()=>{
    app.listen(PORT,()=>{
        console.log(`Server is running on port ${PORT}`);
    })
 })
  .catch((err) => {
    console.error("Failed to connect to database:", err);
    process.exit(1);
  });


