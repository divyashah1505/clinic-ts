import type { Request, Response, NextFunction, Router } from "express";
const jwt = require("jsonwebtoken");
const config = require("../../config/devlopment.json");
const { appString } = require("../components/utils/appString");
const Validator = require("validatorjs");
import { Admin } from "../components/admin/models/admin";
// 
const doctor = require("../components/doctors/models/doctor");
const patient = require("../components/patients/models/patient");

const { error } = require("../components/utils/commonutills");

interface AuthRequest extends Request {
  user?: {
    id: any;
    role: string;
  };
}

const verifyToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    console.log("hiii")
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, message: appString.AUTHORIZATIONHEADERS });
    }
    const token = auth.split(" ")[1];
    const decoded: any = jwt.verify(token, config.ACCESS_SECRET);

    req.user = { id: decoded.id, role: decoded.role };
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: "Invalid or Expired Token" });
  }
};

const checkRole = (isAdminRoute: boolean, isDoctorRoute: boolean, isPatientRoute: boolean) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userPayload = req.user;

      if (!userPayload) {
        return res.status(401).json({ message: appString.Unauthorized });
      }

      const userId = typeof userPayload.id === "object" ? userPayload.id.id : userPayload.id;

      if (!userId) {
        return res.status(400).json({ message: "User identity not found in token" });
      }

      if (isAdminRoute) {
        const data = await Admin .findById(userId);
        if (data) return next();
        return error(res,{ message: appString.ADMIN_UNAUTHORIZED });
      }

      if (isDoctorRoute) {
        const data = await doctor.findById(userId);
        if (data) return next();
        return error(res,{ message: appString.DOCTOR_UNAUTHORIZED });
      }

      if (isPatientRoute) {
        const data = await patient.findById(userId);
        if (data) return next();
        return error(res,{ message: appString.PATIENT_UNAUTHORIZED });
      }

      return error(res,{ message: "Access denied" });
    } catch (err) {
      console.error("Auth Middleware Error:", err);
      return error(res,{ message: appString.SERVER_ERROR });
    }
  };
};

const checkProfileCompletion = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) return res.status(401).json({ message: appString.Unauthorized });

    const doctorData = await doctor.findById(req.user.id);
    if (!doctorData) return res.status(404).json({ message: "Doctor not found" });

    if (doctorData.isProfileComplete !== 1) {
      return error(res, `Please complete your profile. Steps completed: ${doctorData.completedStepsCount || 0}`, 403);
    }
    next();
  } catch (err: any) {
    console.error("Middleware Error:", err.message);
    return error(res, "Internal Server Error", 500);
  }
};

const routeArray = (
  array_: any[],
  router: Router,
  isAdmin: boolean = false,
  isDoctor: boolean = false,
  isPatient: boolean = false
): Router => {
  array_.forEach((route) => {
    const { method, path, controller, middleware, isPublic = false, isProfileCheck = false } = route;
    let middlewares: any[] = [];

    if (!isPublic) {
      // console.log("hhhhhhhhhhhhhhhhhh")
      middlewares.push(verifyToken);


      if (isProfileCheck) {
        middlewares.push(checkProfileCompletion);
      }

      if (isAdmin || isDoctor || isPatient) {
        middlewares.push(checkRole(isAdmin, isDoctor, isPatient));
      }
    }



    if (middleware) {
      middlewares.push(...(Array.isArray(middleware) ? middleware : [middleware]));
    }

    const stack = [...middlewares, controller].filter(fn => typeof fn === "function");
    (router as any)[method](path, ...stack);
  });
  return router;
};

const validatorUtilWithCallback = (rules: object, customMessages?: object) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const lang = (req.headers.lang as string) ?? "en";
    Validator.useLang(lang);

    const validation = new Validator(req.body, rules, customMessages);

    if (validation.passes()) return next();

    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: validation.errors.all(),
    });
  };
};

export {
  verifyToken,
  routeArray,
  validatorUtilWithCallback,
  checkRole,
  checkProfileCompletion,
};
