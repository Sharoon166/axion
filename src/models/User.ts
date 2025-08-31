import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    isAdmin: { type: Boolean, default: false },
    avatar: {
      url: String,
      publicId: String
    },
    role: { 
      type: String, 
      enum: ['user', 'admin'],
      default: 'user' 
    },
    address: {
      street: String,
      city: String,
      postalCode: String,
      country: String,
    },
    wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
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
  avatar?: {
    url: string;
    publicId: string;
  };
  role: 'user' | 'admin';
  address?: {
    street: string;
    city: string;
    postalCode: string;
    country: string;
  };
  wishlist: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}
