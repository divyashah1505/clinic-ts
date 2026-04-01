const express = require("express");
// const patientRoutesArray = require("./routes");
// const { routeArray } = require("../../middleware/index");

// const patientRouter = express.Router();

// routeArray(patientRoutesArray, patientRouter, false,false,true);

// module.exports = patientRouter;

import { routeArray } from "../../middleware";
import { patientroutes } from "./routes";
// const express = require("express");


const patientRouter = express.Router();

routeArray(patientroutes, patientRouter, false,false,true);
export default  patientRouter;
