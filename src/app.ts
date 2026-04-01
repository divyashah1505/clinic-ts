import  adminRouter  from "./components/admin";    
import doctorRouter from "./components/doctors";
import patientRouter from "./components/patients";                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              const express = require("express");
const mongoose = require("mongoose");
const http = require("http")
const path = require("path");
const cors = require("cors");
const config = require("../config/devlopment.json");
const client = require("../src/components/utils/redisClient")
const app = express();
// const adminRouter = require("../src/components/admin/routes");


// const patientRouter = require("../src/components/patients")

import initSocket  from "../src/components/patients/controllers/socketController"

app.set("view engine","ejs");
app.set("views",path.resolve(__dirname,"../src/views"))
app.use(express.json());
const server = http.createServer(app);
initSocket.initSocket(server)
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use("/api/admins", adminRouter);
app.use("/api/doctors", doctorRouter);
app.use("/api/patients",patientRouter)

mongoose.connect(config.DB_URL)
    .then(() => console.log(" MongoDB Connected"))
    .catch((err: string) => console.error(" DB Error:", err));

const PORT = 3000;
server.listen(PORT, () => console.log(` Server running on http://localhost:${PORT}`));