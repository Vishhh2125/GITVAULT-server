import express from 'express';
import {getAllRepos} from "../controllers/repoController.js";



const router = express.Router();


//api routes will be added here
router.route("/").get(getAllRepos)//all repos
// router.route("/:username").get() //all repo for user 
// router.route("/:id").get()   //any s[pecific repo ae per its id  



export default router;
