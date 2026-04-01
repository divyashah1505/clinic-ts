// import mongoose,{Document} from 'mongoose'

import mongoose = require("mongoose");

// const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
import  appString  from '../../utils/appString';
const { validation } = require('../../../components/utils/validation');

interface IAdmin extends mongoose.Document {
  username: string;
  email: string;
  password?: string;
  deletedAt?: Date;
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
  deletedAt: {
    type: Date,
    default: null,
  },
}, { timestamps: true });


const Admin=mongoose.model<IAdmin>(appString.ADMIN_MODEL, adminSchema);

export {Admin}
// module.exports=Admin;