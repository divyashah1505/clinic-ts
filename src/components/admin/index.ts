import { routeArray } from "../../middleware";
import { routes } from "./routes";

const express = require("express");
// const adminRoutesArray = require("./routes");
// const { routeArray } = require("../../middleware/index");

const adminRouter = express.Router();

routeArray(routes, adminRouter, true);

export default adminRouter ;
