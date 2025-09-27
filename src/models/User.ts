import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String },
    password: { type: String, required: true },
    isAdmin: { type: Boolean, default: false },
    avatar: { type: String },
    role: { 
      type: String, 
      enum: ['user', 'admin', 'order admin', 'dev admin'],
      default: 'user' 
    },
    address: { type: String }, // Changed from object to string
    wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
    resetPasswordToken: { type: String },
    resetPasswordExpire: { type: Date },
  },
  { 
    timestamps: true,
    toJSON: {
      transform: function(doc, ret) {
        if ('password' in ret) {
          const { ...rest } = ret;
          return rest;
        }
        return ret;
      }
    }
  }
);


// Create models
const User = mongoose.models?.User || mongoose.model('User', userSchema);

export { User };

export interface IUser extends mongoose.Document {
  name: string;
  email: string;
  password: string;
  isAdmin: boolean;
  avatar?: string;
  phone?: string;
  role: 'user' | 'admin' | 'order admin' | 'dev admin';
  address?: string; // Changed from object to string
  wishlist: mongoose.Types.ObjectId[];
  resetPasswordToken?: string;
  resetPasswordExpire?: Date;
  createdAt: Date;
  updatedAt: Date;
}
