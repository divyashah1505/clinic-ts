import mongoose, { Document, Model, Schema } from "mongoose";
import appString from "../../utils/appString";

export interface Irole extends Document {
  name: string;
  permission: {
    admin: string;
  };
}

const roleSchema: Schema<Irole> = new Schema({
  name: { 
    type: String, 
    required: true, 
    unique: true 
  },
  permission: {
    admin: { 
      type: String, 
      required: true 
    },
  },
});

const RoleModel: Model<Irole> = mongoose.model<Irole>(
  appString.ROLE_MODEL,
  roleSchema
);

export default RoleModel;
