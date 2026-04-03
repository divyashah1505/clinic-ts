import type { Document, Types } from 'mongoose';
import mongoose = require("mongoose");

const { Schema } = mongoose;
import  appString  from "../../utils/appString";
import  ENUM from "../../utils/enum";
const { validation } = require('../../../components/utils/validation');

// ADDED 'export' HERE
export interface IDoctor extends Document {
    username: string;
    email: string;
    password?: string;
    countryCode: string;
    contactNumber: string;
    documents: Types.Map<string> | null;
    appointmentsCharges: number | null;
    experienceDetails: string | null;
    timeSlots: Types.Map<{ startTime: string; endTime: string }> | null;
    otp: string | null;
    otpExpires: Date | null;
    isLoginVerified: number;
    verifiedCurrentSteps: string[];
    isProfileComplete: number;
    completedStepsCount: number;
    isAvailable: number;
    status: number;
    createdAt: Date;
    updatedAt: Date;
}

const doctorSchema = new Schema<IDoctor>({
    username: {
        type: String,
        unique: true,
        required: validation.required(appString.USERNAME_REQUIRED),
        trim: true,
        ...validation.minLength(4),
        ...validation.maxLength(20),
    },
    email: {
        type: String,
        unique: true,
        required: validation.required(appString.EMAIL_REQUIRED),
        ...validation.email,
    },
    password: {
        type: String,
        ...validation.password,
    },
    countryCode: {
        type: String,
        required: validation.required(appString.COUNTRYCODE_REQUIRED),
    },
    contactNumber: {
        type: String,
        required: validation.required(appString.CONTACT_REQUIRED),
    },
    documents: {
        type: Map,
        of: String,
        default: null
    },
    appointmentsCharges: {
        type: Number,
        default: null
    },
    experienceDetails: {
        type: String,
        default: null
    },
    timeSlots: {
        type: Map,
        of: {
            startTime: String,
            endTime: String
        },
        default: null
    },
    otp: {
        type: String,
        default: null,
    },
    otpExpires: {
        type: Date,
        default: null,
    },
    isLoginVerified: {
        type: Number,
        ENUM: [ENUM.ISLOGINVERFIED.VERIFIED, ENUM.ISLOGINVERFIED.UNVERIFIED], 
        default: ENUM.ISLOGINVERFIED.UNVERIFIED
    },
    verifiedCurrentSteps: {
        type: [String],
        default: []
    },
    isProfileComplete: {
        type: Number,
        ENUM: [ENUM.ISPROFILECOMPLETE.COMPLETE, ENUM.ISPROFILECOMPLETE.INCOMPLTE],
        default: ENUM.ISPROFILECOMPLETE.INCOMPLTE
    },
    completedStepsCount: {
        type: Number,
        default: 0
    },
    isAvailable: {
        type: Number,
        enum: [ENUM.ISAVAILABLE.AVAILABLE, ENUM.ISAVAILABLE.UNAVAILABLE],
        default: ENUM.ISAVAILABLE.UNAVAILABLE
    },
    status: {
        type: Number,
        ENUM: [ENUM.DOCTORSTATUS.ACTIVE, ENUM.DOCTORSTATUS.INACTIVE],
        default: ENUM.DOCTORSTATUS.INACTIVE
    }
}, { timestamps: true });

export default mongoose.model<IDoctor>(
    appString.DOCTOR_MODEL, 
    doctorSchema
);
