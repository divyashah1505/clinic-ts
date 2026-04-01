const doctor = require("../models/doctor");
const adminSetting = require("../../admin/models/adminSetting");
const { success, error } = require("../../utils/commonutills");
const appString = require("../../utils/appString");
import type { Request, Response } from "express"
const mongoose = require("mongoose")
   const  editProfile = async (req: any, res: Response) => {
        try {
            const userId = req.user?.id;
            req = req as Request
            if (!userId) return error(res, { success: false, message: "Unauthorized" });

            const doctorId = new mongoose.Types.ObjectId(userId);
            let doctorData = await doctor.findById(doctorId);
            if (!doctorData) return error(res, { message: appString.DOCTORID_NOT_FOUND });

            const adminSettings = await adminSetting.findOne({});
            if (!adminSettings) return error(res, { message: appString.ADMINSETTING_NOT_FOUND });

            for (let key in req.body) {
                doctorData.set(key, req.body[key]);
            }

            const stepsObj = adminSettings.doctorProfileSteps || {};
            const allSteps: any[] = Object.values(stepsObj).filter(step => step && typeof step === 'object' && 'key' in step);
            const totalRequiredCount = allSteps.length;

            let completedStepsKeys: any = [];

            allSteps.forEach((step: any) => {
                const adminKey = step.key;

                const cleanAdmin = adminKey.toLowerCase().replace(/upload|pending|pendig|doccs|docs|multiple|step/gi, "").trim();

                const doctorObj = doctorData.toObject();
                const doctorFields = Object.keys(doctorObj);

                const matchedField = doctorFields.find(field => {
                    const cleanField = field.toLowerCase();
                    return cleanAdmin.includes(cleanField) ||
                        cleanField.includes(cleanAdmin) ||
                        (cleanAdmin.length > 2 && cleanField.startsWith(cleanAdmin.substring(0, 3)));
                });

                let finalField = matchedField;
                if (adminKey.toLowerCase().includes("qualification")) finalField = "experienceDetails";
                if (adminKey.toLowerCase().includes("pendig")) finalField = "bankDetails";

                const value = finalField ? doctorData.get(finalField) : null;

                let isValid = false;
                if (value && (value instanceof Map || value.constructor.name === 'MongooseMap')) {
                    isValid = value.size > 0;
                } else if (value && typeof value === "object" && !Array.isArray(value)) {
                    isValid = Object.keys(value).length > 0;
                } else if (Array.isArray(value)) {
                    isValid = value.length > 0;
                } else {
                    isValid = value !== undefined && value !== null && String(value).trim() !== "";
                }

                if (isValid) {
                    completedStepsKeys.push(adminKey);
                }
            });

            doctorData.verifiedCurrentSteps = completedStepsKeys;
            doctorData.completedStepsCount = completedStepsKeys.length;
            doctorData.isProfileComplete = (doctorData.completedStepsCount >= totalRequiredCount) ? 1 : 0;

            await doctorData.save();

            return success(res, {
                message: appString.PROFILE_UPDATED_SUCCESSFULLY,
                data: {
                    progress: `${doctorData.completedStepsCount}/${totalRequiredCount} steps`,
                    completedStepsList: doctorData.verifiedCurrentSteps,
                    isProfileComplete: doctorData.isProfileComplete,
                    doctor: doctorData
                },
            });
        } catch (err) {
            console.error("Progress Error:", err);
            return error(res, { message: appString.SERVER_ERROR });
        }
    }


export  default{editProfile};
