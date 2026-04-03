// import mongoose,{Document} from 'mongoose'

import mongoose = require("mongoose");
// import Role from "../models/roleModel"
// const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
import appString from '../../utils/appString';
import ENUM from "../../utils/enum";
const { validation } = require('../../../components/utils/validation');

interface IAdmin extends mongoose.Document {
  username: string;
  email: string;
  password?: string;
  deletedAt?: Date;
  role?: mongoose.Types.ObjectId;
  status?: number
}


const adminSchema = new mongoose.Schema<IAdmin>({
  username: {
    type: String,
    unique: true,
    required: validation.required(appString.USERNAME_REQUIRED),
    trim: true,
    ...validation.minLength(4),
    ...validation.maxLength(20),
  },
  email: {
    type: String,
    unique: true,
    required: validation.required(appString.EMAIL_REQUIRED),
    ...validation.email,
  },
  password: {
    type: String,
    ...validation.password,
  },
  role: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Role"

  },
  status: {
    type: Number,
    ENUM: [ENUM.ISADMIN.ACTIVE, ENUM.ISADMIN.INACTIVE],
    default: ENUM.DOCTORSTATUS.INACTIVE
  },
  deletedAt: {
    type: Date,
    default: null,
  },
}, { timestamps: true });


const Admin = mongoose.model<IAdmin>(appString.ADMIN_MODEL, adminSchema);

export { Admin }
