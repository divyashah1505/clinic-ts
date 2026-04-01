const express = require("express");
const router = express.Router();
const { routeArray } = require("../../middleware")
import patientController from "../patients/controllers/patientController"
const patientroutes = [
    {
        path: "/registerPatients",
        method: "post",
        controller: patientController.patientRegister,
        isPublic: true,
    },
   
    {
        path: "/patientLogin",
        method: "post",
        controller: patientController.login,
        isPublic: true
    },
    {
        path: "/verifylogin-otp",
        method: "post",
        controller: patientController.verifyOtpLogin,
        isPublic: true
    },
    {
        path: "/getDoctorAvailableSlots",
        method: "get",
        controller: patientController.getDoctorAvailableSlots,
    },
    {
        path:"/bookAppoitments",
        method:"post",
        controller:patientController.bookAppoitments,
    },
    {
        path:"/cancelAppoitment/:appoitmentId",
        method:"put",
        controller:patientController.cancelAppointment
    },
    {
        path:"/rescheduleAppointment/:appoitmentId",
        method:"put",
        controller:patientController.rescheduleAppointment
    },
    {
        path:"/getAppointments",
        method:"get",
        controller:patientController.getAppointments

    }
   
]
export {patientroutes};
