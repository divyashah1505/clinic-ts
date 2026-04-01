import type { IDoctor } from "../../components/doctors/models/doctor"; 
const adminSetting = require("../admin/models/adminSetting");

const recalculateProfileStatus = async (doctorData: IDoctor): Promise<void> => {
    try {
        const adminSettings = await adminSetting.findOne({});
        if (!adminSettings) return;

        const stepsObj = adminSettings.doctorProfileSteps || {};
        
        const allSteps = Object.values(stepsObj).filter((step: any) => step?.key);

        const requiredSteps = allSteps.slice(
            0,
            adminSettings.noOfSteps || allSteps.length
        );

        let completedSteps: string[] = [];

        for (let step of requiredSteps as any[]) {
            const value = (doctorData as any)[step.key];

            if (value !== undefined && value !== null && value !== "") {
                completedSteps.push(step.key);
            }
        }

        const isAllCompleted = (requiredSteps as any[]).every(step =>
            completedSteps.includes(step.key)
        );

        doctorData.isProfileComplete = isAllCompleted ? 1 : 0;
        
        await doctorData.save();
    } catch (error) {
        console.error("Error recalculating profile status:", error);
    }
};

module.exports = { recalculateProfileStatus };
