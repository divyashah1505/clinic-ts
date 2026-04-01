import doctorController  from "../doctors/controllers/doctorController"

const { routeArray } = require("../../middleware")
const express = require("express");
import editProfilecontroller from "../doctors/controllers/doctorEditProfile"
// const router = express.Router();

const doctorroutes = [
    {
        path: "/register",
        method: "post",
        controller: doctorController.doctorRegister,
        isPublic: true,
    },

    {
        path: "/doctorLogin",
        method: "post",
        controller:doctorController.login,
        isPublic: true
    },
    {
        path: "/verifylogin-otp",
        method: "post",
        controller: doctorController.verifyOtpLogin,
        isPublic: true
    },
    {
        path: "/updateDoctorProfile",
        method: "put",
        controller: editProfilecontroller.editProfile,
    },
    {
        path: "/apply-leave",
        method: "post",
        controller: doctorController.applyLeave,
        isProfileCheck: true
    },
    {
        path: "/updateAppointmentStatus/:appointmentId",
        method: "put",
        controller:doctorController.updateAppointmentStatus,
        isProfileCheck: true

    },
    {
        path: "/getDoctorAppointments",
        method: "get",
        controller:doctorController.getDoctorAppointments,
        isProfileCheck: true

    }

]
export {doctorroutes} 
