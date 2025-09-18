import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    category: { type: String, required: true },
    style: { type: String, required: true },
    overview: { type: String, required: true },
    content: { type: String, default: '' },
    keyFeatures: { type: String, default: '' },
    technicalSpecs: {
      projectType: { type: String, default: '' },
      // location: { type: String, default: '' },
      completion: { type: String, default: '' },
      duration: { type: String, default: '' },
      team: { type: String, default: '' },
    },
    clientTestimonial: {
      text: { type: String, default: '' },
      author: { type: String, default: '' },
    },
    images: { type: [String], required: true },
    location: { type: String, required: true },
    date: { type: String, required: true },
    featured: { type: Boolean, default: false },
  },
  { timestamps: true },
);

// Clear any existing model to force schema refresh
if (mongoose.models.Project) {
  delete mongoose.models.Project;
}

export default mongoose.model('Project', projectSchema);
