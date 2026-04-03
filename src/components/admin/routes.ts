const express = require("express");
const router = express.Router();
const { routeArray } = require("../../middleware")

import adminController from "../admin/controllers/adminController"
import adminSettingController from "../admin/controllers/adminSettingController"
// import Permission from "../../"
const routes = [
  {
    path: "/registeradmin",
    method: "post",
    controller: adminController.register,
    isPublic: true,
  },
  {
    path: "/loginAdmin",
    method: "post",
    controller: adminController.login,
    isPublic: true,
  },
  {
    path: "/createProfileSteps",
    method: "post",
    controller: adminSettingController.createProfileSteps,
    permissions: [{ name: "admin", index: 0 }]

  },
  {
    path: "/verifyDoctor",
    method: "post",
    controller: adminController.verifyDoctor,
    permissions: [{ name: "admin", index: 1 }]

  },
  {
    path: "/leavestatus/:leaveId",
    method: "put",
    controller: adminController.updateLeaveStatus,
    permissions: [{ name: "admin", index: 1 }]


  },
  {
    path: "/getAllDoctors",
    method: "get",
    controller: adminController.getAllDoctors,
    permissions: [{ name: "admin", index: 1 }]
  },
  {
    path: "/createRole",
    method: "post",
    controller: adminController.createRole,
    permissions: [{ name: "admin", index: 0 }]

  },
  {
    path: "/addSubAdmin",
    method: "post",
    controller: adminController.addSubAdmin,
    permissions: [{ name: "admin", index: 0 }]


  },
  {
    path: "/updateSubAdmin/:id",
    method: "put",
    controller: adminController.updateSubAdmin,
    permissions: [{ name: "admin", index: 0 }]

  },
  {
    path: "/deleteReActivateSubAdmin/:id",
    method: "post",
    controller: adminController.deleteReActivateSubAdmin,
    permissions: [{ name: "admin", index: 0 }]

  }

]

export { routes }