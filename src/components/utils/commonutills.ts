import type { Request, Response, NextFunction } from 'express';
import mongoose = require('mongoose');
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const config = require("../../../config/devlopment.json");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const client = require("../utils/redisClient");
const { parsePhoneNumberFromString } = require("libphonenumber-js");
import  appString from "./appString";
const Wallet = require("../patients/models/wallet");
const Appointment = require("../patients/models/appotment");
import  ENUM from "../utils/enum";
const cron = require("node-cron");

const uploadDir = path.join(__dirname, "../../../uploads/IMG");

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req: Request, file: any, cb: (error: Error | null, destination: string) => void) => cb(null, uploadDir),
    filename: (req: Request, file: any, cb: (error: Error | null, filename: string) => void) => cb(null, Date.now() + "-" + file.originalname),
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req: Request, file: any, cb: any) => {
        if (file.mimetype.startsWith("image/")) cb(null, true);
        else cb(new Error(appString.img_ERR), false);
    },
});

const success = (res: Response, data: any = {}, message: string, statusCode: number = 200) =>
    res.status(statusCode).json({ success: true, message, data });

const error = (res: Response, message: string, statusCode: number = 422) =>
    res.status(statusCode).json({ success: false, message });

const storeUserToken = async (userId: string, accessToken: string, refreshToken: string): Promise<void> => {
    await client.set(`auth:accessToken:${userId}`, accessToken, { expiresIn: "1d" });
    await client.set(`auth:refreshToken:${userId}`, refreshToken, { expiresIn: "1d" });
};

const removeUserToken = async (userId: string): Promise<void> => {
    if (!userId) return;
    await client.del(`auth:accessToken:${userId}`);
    await client.del(`auth:refreshToken:${userId}`);
};

const getActiveToken = async (userId: string): Promise<string | null> => {
    return await client.get(`auth:accessToken:${userId}`);
};

const generateTokens = async (user: any): Promise<{ accessToken: string; refreshToken: string }> => {
    if (!config.ACCESS_SECRET || !config.REFRESH_SECRET)
        throw new Error(appString.jWTNOT_DEFINED);

    const payload = { id: user._id || user.id || user, role: user.role || "user" };

    const accessToken = jwt.sign(payload, config.ACCESS_SECRET, { expiresIn: "2h" });
    const refreshToken = jwt.sign(payload, config.REFRESH_SECRET, { expiresIn: "7d" });

    await storeUserToken(payload.id.toString(), accessToken, refreshToken);
    return { accessToken, refreshToken };
};

const generateOTP = (): string => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

const handleRefreshToken = async (req: Request, res: Response) => {
    try {
        const authHeader = req.headers["authorization"];
        const refreshToken = authHeader?.split(" ")[1];

        if (!refreshToken) {
            return error(res, "Token missing", 401);
        }

        const decoded: any = jwt.verify(
            refreshToken,
            process.env.REFRESH_SECRET || config.REFRESH_SECRET,
        );

        const actualId = typeof decoded.id === "object" ? decoded.id.id : decoded.id;
        const actualRole = typeof decoded.id === "object" ? decoded.id.role : decoded.role;

        const newTokens = await generateTokens({ id: actualId, role: actualRole });
        return res.status(200).json({ success: true, ...newTokens });
    } catch (err: any) {
        return res.status(403).json({ success: false, message: "Invalid or expired refresh token" });
    }
};

const validateContact = (countryCode: string, contactNumber: string) => {
    try {
        if (!countryCode || !contactNumber) return { valid: false, message: appString.COUNTRY_CODECONTACT_NUMBER_REQUIRED };
        if (!countryCode.startsWith("+")) return { valid: false, message: appString.CODEMUSTSTARTSWITHADDITIONOPERATORS };

        const fullNumber = `${countryCode}${contactNumber}`;
        const parsed = parsePhoneNumberFromString(fullNumber);

        if (!parsed || !parsed.isValid()) {
            return { valid: false, message: appString.INVALID_PHONEFORMAT };
        }

        return { valid: true, fullNumber: parsed.number, country: parsed.country };
    } catch (err) {
        return { valid: false, message: appString.INVALID_PHONEFORMAT };
    }
};

cron.schedule('*/20 * * * *', async () => {
    try {
        console.log('Running appointment auto-reject cron...');
        const now = new Date(); 
        const cutoffTime = new Date(now.getTime() - 20 * 60 * 1000);
        
        const pendingAppointments = await Appointment.find({
            status: ENUM.APPOITMENTSTATUS.PENDING,
            createdAt: { $lte: cutoffTime }
        });

        for (let appoint of pendingAppointments) {
            const refundAmount = Number(appoint.totalAmount); 
            
            if (!isNaN(refundAmount) && refundAmount > 0) { 
                await Wallet.updateOne(
                    { patientId: appoint.patientId },
                    { $inc: { totalAmount: refundAmount, frozenAmount: -refundAmount } }
                );
            }

            appoint.status = ENUM.APPOITMENTSTATUS.REJECT;
            await appoint.save();
        }
        console.log(`Auto-rejected ${pendingAppointments.length} appointments`);
    } catch (err) {
        console.error('Cron error:', err);
    }
});

export  { 
    storeUserToken, 
    removeUserToken, 
    getActiveToken, 
    generateTokens, 
    handleRefreshToken, 
    success, 
    error, 
    upload, 
    validateContact, 
    generateOTP 
};
