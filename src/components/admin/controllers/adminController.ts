// const Admin = require("../models/admin");
const { generateTokens, success, error } = require("../../utils/commonutills");
import appString from "../../utils/appString";
import Doctor from "../../doctors/models/doctor";
import ENUM from "../../utils/enum";
const doctorLeave = require("../../doctors/models/doctorLeave");
const doctor = require("../../doctors/models/doctor");
import bcrypt from "bcryptjs";
import type { Request, Response } from "express"
import { Admin } from "../models/admin";
import RoleModel, { Irole } from "../models/roleModel";

const register = async (req: Request, res: Response) => {
  try {
    console.log("hit api");
    const { username, email, password } = req.body;

    const adminExists = await Admin.findOne({ email });
    if (adminExists) {
      return error(res, appString.ADMINALREDY_REGISTER, 409);
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const newAdmin = await Admin.create({ username, email, password: hashedPassword });

    const tokens = await generateTokens(newAdmin._id);

    return success(res, { admin: newAdmin, ...tokens }, appString.ADMIN_CREATED, 201);

  } catch (err: any) {
    console.error("Registration Error:", err);
    if (err.code === 11000) {
      const field = Object.keys(err.keyValue)[0];
      return error(res, `${field} already exists`, 409);
    }
    return error(res, err.message || appString.REGISTRATION_FAILED, 400);
  }
}


const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const admin = await Admin.findOne({ email });
    if (!admin) {
      return error(res, appString.INVALID_CREDENTIALS, 401);
    }

    const tokens = await generateTokens(admin);
    return success(res, { username: admin.username, email: admin.email, ...tokens }, appString.LOGIN_SUCCESS);
  } catch (err) {
    return error(res, appString.LOGIN_FAILED, 500);
  }
}

const createRole = async (req: Request, res: Response) => {
  try {
    const { name, permission } = req.body;

    if (!name || !permission || !permission.user) {
      return error(res, {
        success: false,
        message: appString.REQUIRED_FIELDS
      });
    }

    const newRole: Irole = new RoleModel({
      name,
      permission,
    });

    await newRole.save();

    console.log("Role Created:", newRole);

    return res.status(201).json({
      success: true,
      message: appString.ROLL_CREATED_SUCESS,
      data: newRole,
    });
  } catch (error: any) {
    console.error("Error creating role:", error);

    if (error.code === 11000) {
      return error(res, {
        success: false,
        message: appString.ROLL_NAME_EXIST
      });
    }

    return res.status(500).json({
      success: false,
      message: appString.SERVER_ERROR
    });
  }
}

const addSubAdmin = async (req: Request, res: Response) => {
  try {
    const { username, email, password, role } = req.body;

    if (!username || !email || !password || !role) {
      return error(res, { success: false, message: appString.REQUIRED_FIELDS });
    }

    const existingAdmin = await Admin.findOne({
      $or: [{ email }, { username }]
    });
    if (existingAdmin) {
      return error(res, { success: false, message: appString.ALREDY_EXIST });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newAdmin = new Admin({
      username,
      email,
      password: hashedPassword,
      role,
      status: ENUM.ISADMIN.ACTIVE
    });

    await newAdmin.save();

    return success(res, {
      success: true,
      message: appString.SUADMIN_ADDED_SUCCESS,
      data: { id: newAdmin._id, username: newAdmin.username, email: newAdmin.email }
    });

  } catch (err: any) {
    console.error("Add SubAdmin Error:", err);
    return error(res, { message: appString.SERVER_ERROR });
  }
};


const updateSubAdmin = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { username, email, password, role } = req.body;
    console.log(req.body)
    const exisitngSubAdmin = await Admin.findById(id);
    if (!exisitngSubAdmin) {
      return error(res, { message: appString.USER_NOT_FOUND })
    }
    exisitngSubAdmin.username = username ?? exisitngSubAdmin.username
    exisitngSubAdmin.email = email ?? exisitngSubAdmin.email
    exisitngSubAdmin.password = password ?? exisitngSubAdmin.password
    exisitngSubAdmin.role = role ?? exisitngSubAdmin.role
    const updatedSubAdmin = await exisitngSubAdmin.save();
    console.log(updatedSubAdmin)
    return success(res, { data: updatedSubAdmin }, appString.SUBADMIN_UPDATED_SUCCESS)
  } catch (error: any) {
    return error(res, { message: appString.SERVER_ERROR })
  }
};
const deleteReActivateSubAdmin = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    console.log(req.params)
    const { status } = req.body
    console.log(req.body);
    const subAdmin = await Admin.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    );
    if (!subAdmin) {
      return error(res, { message: appString.USER_NOT_FOUND })
    }
    return success(res,{data:subAdmin},appString.SUBADMIN_STATUS_UPDATED_SUCCESSFULLY)

  } catch (error: any) {
    return error(res, { message: appString.SERVER_ERROR })
  }
}






const verifyDoctor = async (req: Request, res: Response) => {
  const { doctorId } = req.query;
  const doctor = await Doctor.findById(doctorId);
  console.log(doctor);

  if (!doctor || doctor.isProfileComplete === ENUM.ISPROFILECOMPLETE.COMPLETE) {
    return error(res, { message: appString.DOCTOR_NOT_ELIGIBLE });
  }

  doctor.isProfileComplete = 1;
  await doctor.save();

  return success(res, { message: appString.DOCTOR_VERIFIED_SUCCESSFULLY });
}
const updateLeaveStatus = async (req: Request, res: Response) => {
  try {
    const { leaveId } = req.params;
    console.log(leaveId);

    const { status } = req.body;
    if (![1, 2].includes(status)) {
      return error(res, { success: false, message: appString.STATUS_MUSTBE_1OR2 })
    }
    const leave = await doctorLeave.findById(leaveId);
    if (!leave) {
      return error(res, { success: false, message: appString.LEVAE_REQUEST_NOT_FOUND })
    }
    if (leave.status !== 0) {
      return error(res, { success: false, messgae: appString.LEAVE_ALEREADY_PROCEED })
    }
    leave.status = status
    await leave.save();

    if (status === 1) {
      await doctor.findByIdAndUpdate(leave.doctorId, {
        isAvailable: 0
      })

      return success(res, { success: true, message: status === 1 ? appString.LEAVE_APPROVED : appString.LEAVE_REJECT, data: leave })
    }
  } catch (err) {
    console.error(err)
    return error(res, { success: false, message: appString.SERVER_ERROR })
  }
}

const getAllDoctors = async (req: Request, res: Response) => {
  try {

    const { status, isAvailable, search } = req.query;

    let filter: any = {};

    if (status) {
      filter.status = Number(status);
    }

    if (isAvailable) {
      filter.isAvailable = Number(isAvailable);
    }

    if (search) {
      filter.$or = [
        { username: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } }
      ];
    }

    const doctors = await Doctor.find(filter)
      .select("-password -otp -otpExpires")
      .sort({ createdAt: -1 });

    return success(res, {
      count: doctors.length,
      doctors
    }, appString.DOCTORS_FETCHED_SUCESSFULLY);

  } catch (err) {
    console.error(err);
    return error(res, appString.SERVER_ERROR);
  }
}


export default { register, login, createRole, addSubAdmin, updateSubAdmin, deleteReActivateSubAdmin, verifyDoctor, updateLeaveStatus, getAllDoctors };
