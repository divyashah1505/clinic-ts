import type { Document, Model } from 'mongoose';
import mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const { Schema } = mongoose;
import   appString  from "../../utils/appString";
import  ENUM from "../../utils/enum";
const { validation } = require('../../../components/utils/validation');

interface IPatient extends Document {
    username: string;
    email: string;
    password?: string;
    countryCode: string;
    contactNumber: string;
    otp: string | null;
    otpExpires: Date | null;
    isLoginVerified: number;
    createdAt: Date;
    updatedAt: Date;
    matchPassword(enteredPassword: string): Promise<boolean>;
}

const patientsSchema = new Schema<IPatient>({
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
        required: validation.required(appString.Contact_REQUIRED),
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
        enum: [ENUM.ISLOGINVERFIED.VERIFIED, ENUM.ISLOGINVERFIED.UNVERIFIED],
        default: ENUM.ISLOGINVERFIED.UNVERIFIED || 0
    },
}, { timestamps: true });

patientsSchema.methods.matchPassword = async function (enteredPassword: string): Promise<boolean> {
    return await bcrypt.compare(enteredPassword, this.password);
};
patientsSchema.pre<IPatient>('save', async function () {
    if (!this.isModified('password') || !this.password) {
        return;
    }

    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
    } catch (error: any) {
        throw new Error(error);
    }
});

module.exports = mongoose.model<IPatient>(
    appString.PATIENT_MODEL,
    patientsSchema
);
