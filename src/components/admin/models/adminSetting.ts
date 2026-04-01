import type { Document, Types } from 'mongoose';
import mongoose = require('mongoose'); 

const { Schema } = mongoose;
import  appString  from '../../utils/appString';

interface IAdminSettings extends Document {
  defaultBalance: number;
  doctorProfileSteps: {
    step1: { key: string };
    step2: { key: string };
    step3: { key: string };
    step4: { key: string };
    step5?: { key: string };
    step6?: { key: string };
  };
  noOfSteps?: number;
  doctorRefund?: Record<string, any>;
  patientRefund?: Record<string, any>;
  commonHolidays?: any[];
  wokringHours: Types.Map<string>[];
  leaveApplyBefore: number;
  maxLeaveApply: number;
  createdAt: Date;
  updatedAt: Date;
}

const adminSettingsSchema = new Schema<IAdminSettings>(
  {
    defaultBalance: { 
      type: Number, 
      default: 1000 
    },
    doctorProfileSteps: {
      step1: { key: { type: String, required: true } },
      step2: { key: { type: String, required: true } },
      step3: { key: { type: String, required: true } },
      step4: { key: { type: String, required: true } },
      step5: { key: { type: String, required: false } },
      step6: { key: { type: String, required: false } },
    },
    noOfSteps: { type: Number },
    doctorRefund: { type: Object },
    patientRefund: { type: Object },
    commonHolidays: { type: Array },
    wokringHours: [{ type: Map, of: String }],
    leaveApplyBefore: { type: Number, default: 3 },
    maxLeaveApply: { type: Number, default: 5 },
  },
  { timestamps: true }
);

module.exports = mongoose.model<IAdminSettings>(
  appString.ADMIN_SETTINGS_MODEL, 
  adminSettingsSchema
);
