// const {doctor} = require("../models/doctor");
const { generateTokens, success, error, validateContact, generateOTP } = require("../../utils/commonutills");
// const { appString } = require("../../utils/appString");
const bcrypt = require("bcryptjs");
const verificationTemplate = require("../../utils/emailTemplate");
const mongoose = require("mongoose")
const crypto = require("crypto")
const { sendEmail } = require("../../utils/mailSender");
const { render } = require("ejs");
const client = require("../../utils/redisClient");
import Doctor from "../models/doctor";
const doctorLeave = require("../models/doctorLeave");
const Appointment = require("../../patients/models/appotment")
const Wallet = require("../../patients/models/wallet")
import ENUM from "../../utils/enum";
const patient = require("../../patients/models/patient");
import type { Request, Response } from "express"

import appString from "../../utils/appString";

const doctorRegister = async (req: Request, res: Response) => {
    try {
        const { username, email, password, countryCode, contactNumber } = req.body;
        console.log(req.body)
        const doctoExist = await Doctor.findOne({ email });
        if (doctoExist) return error(res, { success: false, message: appString.EMAILALREDY_REGISTERED });

        const phoneValidation = validateContact(countryCode, contactNumber);
        if (!phoneValidation.valid) {
            return error(res, { success: false, message: phoneValidation.message });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const newDoctor = new Doctor({ username, email, password: hashedPassword, countryCode, contactNumber })
        await newDoctor.save();

        await Wallet.create({ doctorId: newDoctor._id })

        return success(res, { success: true }, appString.DOCTOR_RGISTRATION_SUCCESSFULL);
    } catch (err) {
        console.error(err);
        return error(res, { success: false, message: appString.SERVER_ERROR });
    }
}
const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        const doctorDoc = await Doctor.findOne({ email });

        if (!doctorDoc) {
            return error(res, { messgae: appString.INVALID_CREDENTIALS }, 401);
        }
        const isMatch = await bcrypt.compare(password, doctorDoc!.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid credentials" });
        }
        const otp = generateOTP();
        // const otpExpires = Date.now() + 10 * 60 * 1000;
        const futureTimeMillis = Date.now() + 10 * 60 * 1000;
        const otpExpires = new Date(futureTimeMillis);

        console.log(otpExpires);
        doctorDoc.otp = otp;
        doctorDoc.otpExpires = otpExpires;
        doctorDoc.isLoginVerified = 0;
        await doctorDoc.save();

        const subject = "Your Login OTP Code";
        const html = `<p>Your OTP for login is: <strong>${otp}</strong>. It is valid for 10 minutes.</p>`;
        await sendEmail(email, subject, html);


        success(
            res,
            { message: appString.OTP_SENT_SUCCESS, email: doctorDoc.email },
            appString.OTP_SENT_SUCCESS
        );
    } catch (err) {
        console.error(err);
        error(res, { message: appString.LOGIN_FAILED }, 500);
    }
}

const verifyOtpLogin = async (req: Request, res: Response) => {
    try {
        const { email, otp } = req.body;
        const doctor: any = await Doctor.findOne({ email });

        if (!doctor) {
            return error(res, { messgae: appString.USER_NOT_FOUND }, 404);
        }

        if (doctor.otp !== otp || doctor!.otpExpires < Date.now()) {
            return error(res, { message: appString.INVALID_OR_EXPIRED_OTP }, 400);
        }

        doctor.isLoginVerified = 1;
        doctor.otp = undefined;
        doctor.otpExpires = undefined;

        await doctor.save();

        const tokens = await generateTokens(doctor);

        success(
            res,
            {
                username: doctor.username,
                email: doctor.email,
                ...tokens,
            },
            appString.LOGIN_SUCCESS_VERIFIED
        );

    } catch (err) {
        console.error(err);
        error(res, { messgae: appString.OTP_VERIFICATION_FAILED }, 500);
    }
}
const applyLeave = async (req: any, res: Response) => {
    try {
        const userId = req.user?.id;
        req = req as Request
        if (!userId) return error(res, { success: false, message: "Unauthorized" });

        const doctorId = new mongoose.Types.ObjectId(userId);

        const { fromDate, toDate, reason, slots } = req.body;

        const today = new Date();
        const leaveStart = new Date(fromDate);
        const leaveEnd = new Date(toDate);

        if (slots) {
            if (!Array.isArray(slots) || slots.length === 0) {
                return error(res, { success: false, message: appString.SLOTS_MUSTBE_NONEMPTY_ARRAY });
            }

            const isSameDay = leaveStart.toDateString() === leaveEnd.toDateString();
            if (!isSameDay) {
                return error(res, { success: false, message: appString.SLOTESSELECTED_FROMDATEANDTODATE_MUSTBE_SAME });
            }
        }

        const diffTime = leaveStart.getTime() - today.getTime();
        const diffDays = diffTime / (1000 * 60 * 60 * 24);

        if (diffDays < 3) {
            return error(res, { success: false, message: appString.LEAVE_MUST_APPLY_BEFORE_3DAYS });
        }

        if (leaveEnd < leaveStart) {
            return error(res, { success: false, message: appString.TODATE_CANNOT_BEFOR_FROM_DATE });
        }

        const existingLeave = await doctorLeave.findOne({
            doctorId,
            fromDate: { $lte: leaveEnd },
            toDate: { $gte: leaveStart }
        });

        if (existingLeave) {
            return error(res, { success: false, message: appString.ALREDY_APPLIED_LEAVE });
        }

        const leave = await doctorLeave.create({
            doctorId,
            fromDate: leaveStart,
            toDate: leaveEnd,
            reason,
            slots
        });

        return success(res, { success: true, data: leave }, appString.LEAVE_APPLIED_SUCCESSFULLY);
    } catch (err) {
        console.error(err);
        return error(res, { success: false, message: appString.SERVER_ERROR });
    }
}
const updateAppointmentStatus = async (req: Request, res: Response) => {
    try {
        const { appointmentId } = req.params;
        const { status } = req.body;

        if (![ENUM.APPOITMENTSTATUS.ACCEPT, ENUM.APPOITMENTSTATUS.REJECT].includes(status)) {
            return error(res, { success: false, message: appString.INVALID_STATUS });
        }

        const appointment = await Appointment.findById(appointmentId);
        if (!appointment) {
            return error(res, { success: false, message: appString.APPOITMENT_NOT_FOUND });
        }

        if (appointment.status !== ENUM.APPOITMENTSTATUS.PENDING) {
            return error(res, { success: false, message: appString.APPOITMENT_ALREADY_BOOKED });
        }

        if (status === ENUM.APPOITMENTSTATUS.REJECT) {
            appointment.cancelBy = appointment.doctorId;
        }

        appointment.status = status;
        await appointment.save();

        const charges = appointment.totalAmount;

        if (status === ENUM.APPOITMENTSTATUS.ACCEPT) {
            await Wallet.updateOne(
                { patientId: appointment.patientId },
                { $inc: { frozenAmount: -charges } }
            );
            await Wallet.updateOne(
                { doctorId: appointment.doctorId },
                { $inc: { frozenAmount: charges } },
                { upsert: true }
            );
        } else {
            await Wallet.updateOne(
                { patientId: appointment.patientId },
                { $inc: { frozenAmount: -charges, amount: charges } }
            );
        }

        return success(res, { success: true, data: appointment }, status === ENUM.APPOITMENTSTATUS.ACCEPT ? appString.APPOITMENT_BOOKED_SUCCESSFULLY : appString.APPOITMENT_REJECTED_SUCCESSFULLY);

    } catch (error: any) {
        console.error("Update Appointment Error:", error);
        return error(res, { success: false, message: appString.SERVER_ERROR });
    }
}

const getDoctorAppointments = async (req: any, res: Response) => {
    try {
        const userId = req.user?.id;
        req = req as Request
        if (!userId) return error(res, { success: false, message: "Unauthorized" });

        const doctorId = new mongoose.Types.ObjectId(userId);

        const { status, page = 1, limit = 10, date } = req.query as {
            status?: string;
            page?: string;
            limit?: string;
            date?: string;
        };

        const query: any = { doctorId };

        if (status) {
            query.status = Number(status);
        }

        if (date) {
            const start = new Date(date);
            start.setHours(0, 0, 0, 0);
            const end = new Date(date);
            end.setHours(23, 59, 59, 999);
            query.appointmentDate = { $gte: start, $lte: end };
        }

        const skip = (Number(page) - 1) * Number(limit);

        const [appointments, total] = await Promise.all([
            Appointment.find(query)
                .populate("patientId", "username email contactNumber")
                .sort({ appointmentDate: -1 })
                .skip(skip)
                .limit(Number(limit)),
            Appointment.countDocuments(query)
        ]);

        return success(
            res,
            {
                appointments,
                pagination: {
                    total,
                    page: Number(page),
                    limit: Number(limit),
                    pages: Math.ceil(total / Number(limit))
                }
            },
            appString.APPOITMENT_FETCHED_SUCCESSFULLY
        );

    } catch (err) {
        console.error(err);
        return error(res, { success: false, message: appString.SERVER_ERROR });
    }
}



export default { doctorRegister, login, verifyOtpLogin, applyLeave, updateAppointmentStatus, getDoctorAppointments }