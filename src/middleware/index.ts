import type { Request, Response, NextFunction, Router } from "express";
const jwt = require("jsonwebtoken");
const config = require("../../config/devlopment.json");
import appString from "../components/utils/appString";
const Validator = require("validatorjs");
import  {Admin}  from "../components/admin/models/admin";
import RoleModel from "../components/admin/models/roleModel";
import { ObjectId } from "mongoose";
// import Permission from "../components/admin/models/roleModel"
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
    // console.log("veriftoken log")
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, message: appString.AUTHORIZATIONHEADERS });
    }
    const token = auth.split(" ")[1];
    const decoded: any = jwt.verify(token, config.ACCESS_SECRET);

    req.user = { id: decoded.id, role: decoded.role };
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message:appString.INVALID_TOKENS });
  }
};

const checkRole = (isAdminRoute: boolean, isDoctorRoute: boolean, isPatientRoute: boolean, requiredIndex?: any) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userPayload = req.user;
      if (!userPayload) return res.status(401).json({ message: appString.UNAUTHORIZED });

      const userId = typeof userPayload.id === "object" ? userPayload.id.id : userPayload.id;
      let userData: any = null;

      if (isAdminRoute) {
        userData = await Admin.findOne({ _id: userId }).populate('role');
      } else if (isDoctorRoute) {
        userData = await doctor.findOne({ _id: userId });
      } else if (isPatientRoute) {
        userData = await patient.findOne({ _id: userId });
      }

      if (!userData) {
        return error(res, { message: "Access denied: User not found in this role" });
      }

      if (isAdminRoute && requiredIndex && Array.isArray(requiredIndex)) {
        const PER = userData.role?.permission;
        if (!PER) return error(res, { message:appString.PERMISSION_NOT_ALLOWED });

        for (const data of requiredIndex) {
          if (!PER[data.name] || PER[data.name].charAt(data.index) !== "1") {
            return error(res, { message: appString.PERMISSION_NOT_ALLOWED });
          }
        }
      }

      return next();

    } catch (err) {
      console.error("Auth Middleware Error:", err);
      if (!res.headersSent) {
        return error(res, { message: appString.SERVER_ERROR });
      }
    }
  };
};




const checkProfileCompletion = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) return res.status(401).json({ message: appString.UNAUTHORIZED });

    const doctorData = await doctor.findById(req.user.id);
    if (!doctorData) return res.status(404).json({ message: "Doctor not found" });

    if (doctorData.isProfileComplete !== 1) {
      return error(res, `Please complete your profile. Steps completed: ${doctorData.completedStepsCount || 0}`, 403);
    }
    next();
  } catch (err: any) {
    console.error("Middleware Error:", err.message);
    return error(res, appString.SERVER_ERROR,500);
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
    const { method, path, controller, middleware, isPublic = false, isProfileCheck = false, permissions } = route;
    let middlewares: any[] = [];

    if (!isPublic) {
      middlewares.push(verifyToken);

      if (isProfileCheck) {
        middlewares.push(checkProfileCompletion);
      }

      if (isAdmin || isDoctor || isPatient) {
        // const requiredIndex = permissions && permissions.length > 0 ? permissions[0].index : undefined;
        middlewares.push(checkRole(isAdmin, isDoctor, isPatient, permissions));
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
