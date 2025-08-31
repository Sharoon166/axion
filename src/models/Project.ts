import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    category: { type: String, required: true },
    style: { type: String, required: true },
    overview: { type: String, required: true },
    features: [String],
    specs: {
      type: {
        projectType: { type: String, default: '' },
        projectLocation: { type: String, default: '' },
        completion: { type: String, default: '' },
        duration: { type: String, default: '' },
        team: { type: String, default: '' },
      },
      required: false
    },
    testimonial: {
      type: {
        text: String,
        author: String,
      },
      required: false
    },
    images: [String],
    location: { type: String, required: true },
    date: { type: String, required: true },
    image: { type: String, required: true },
    featured: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export default mongoose.models.Project || mongoose.model('Project', projectSchema);
