import { routeArray } from "../../middleware";
import { doctorroutes } from "./routes";
const express = require("express");


const doctorRouter = express.Router();

routeArray(doctorroutes, doctorRouter, false, true, false);

export  default doctorRouter;
