import type { Document, Types } from 'mongoose';
import mongoose = require("mongoose");

const { Schema } = mongoose;
import  appString  from "../../utils/appString";
import  ENUM from "../../utils/enum";

interface IAppointment extends Document {
    doctorId: Types.ObjectId;
    patientId: Types.ObjectId;
    appointmentDate: Date;
    startTime: string;
    endTime: string;
    status: number;
    totalAmount?: number;
    cancelBy?: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const appointmentSchema = new Schema<IAppointment>({
    doctorId: {
        type: Schema.Types.ObjectId,
        ref: appString.DOCTOR_MODEL,
        required: true
    },
    patientId: {
        type: Schema.Types.ObjectId,
        ref: appString.PATIENT_MODEL,
        required: true
    },
    appointmentDate: {
        type: Date,
        required: true
    },
    startTime: {
        type: String,
        required: true
    },
    endTime: {
        type: String,
        required: true
    },
    status: {
        type: Number,
        ENUM: [
            ENUM.APPOITMENTSTATUS.PENDING, 
            ENUM.APPOITMENTSTATUS.ACCEPT, 
            ENUM.APPOITMENTSTATUS.REJECT
        ],
        default: ENUM.APPOITMENTSTATUS.PENDING
    },
    totalAmount: {
        type: Number
    },
    cancelBy: {
        type: Schema.Types.ObjectId,
    }
}, { timestamps: true });

module.exports = mongoose.model<IAppointment>(
    appString.APPOITMENT_MODEL, 
    appointmentSchema
);
