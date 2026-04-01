import type { Document, Types } from 'mongoose';
import mongoose = require("mongoose");

const { Schema } = mongoose;
import  appString  from "../../utils/appString";
import ENUM from "../../utils/enum";

interface IDoctorLeave extends Document {
    doctorId: Types.ObjectId;
    fromDate: Date;
    toDate: Date;
    reason?: string;
    slots: Types.Map<string>[];
    status: number;
    createdAt: Date;
    updatedAt: Date;
}

const doctorLeaveSchema = new Schema<IDoctorLeave>({
    doctorId: {
        type: Schema.Types.ObjectId,
        ref: appString.DOCTOR_MODEL,
        required: true
    },
    fromDate: {
        type: Date,
        required: true
    },
    toDate: {
        type: Date,
        required: true
    },
    reason: {
        type: String
    },
    slots: [{
        type: Map,
        of: String,
    }],
    status: {
        type: Number,
        ENUM: [
            ENUM.DOCTORLEAVESTATUS.PENDING, 
            ENUM.DOCTORLEAVESTATUS.ACCEPT, 
            ENUM.DOCTORLEAVESTATUS.REJECT
        ],
        default: ENUM.DOCTORLEAVESTATUS.PENDING
    }
}, { timestamps: true }); 

module.exports = mongoose.model<IDoctorLeave>(
    appString.DOCTOR_LEAVE, 
    doctorLeaveSchema
);
