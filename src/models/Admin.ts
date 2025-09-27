import mongoose from 'mongoose';

const adminSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true, select: false },
    avatar: { type: String },
    role: { 
      type: String, 
      enum: ['admin', 'order admin', 'dev admin'],
      default: 'admin' 
    },
    permissions: [String],
    lastActive: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Add methods and statics here if needed

const Admin = mongoose.models?.Admin || mongoose.model('Admin', adminSchema);

export default Admin;
