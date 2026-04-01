import type { Document, Types } from 'mongoose';
import mongoose = require("mongoose");

const { Schema } = mongoose;
import   appString  from "../../utils/appString";
import ENUM from "../../utils/enum";

interface IWallet extends Document {
    doctorId?: Types.ObjectId;
    patientId?: Types.ObjectId;
    frozenAmount: number;
    totalAmount: number;
    status: number;
    createdAt: Date;
    updatedAt: Date;
}

const walletSchema = new Schema<IWallet>({
    doctorId: {
        type: Schema.Types.ObjectId,
        ref: appString.DOCTOR_MODEL,
    },
    patientId: {
        type: Schema.Types.ObjectId,
        ref: appString.PATIENT_MODEL,
    },
    frozenAmount: {
        type: Number,
        default: 0
    },
    totalAmount: {
        type: Number,
        default: 0
    },
    status: {
        type: Number,
        ENUM: [
            ENUM.WALLETSTATUS.ACTIVE, 
            ENUM.WALLETSTATUS.INACTIVE
        ],
        default: ENUM.WALLETSTATUS.INACTIVE
    }
}, { timestamps: true });

module.exports = mongoose.model<IWallet>(
    appString.WALLET_MODEL, 
    walletSchema
);
