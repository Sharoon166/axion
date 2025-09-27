import mongoose from 'mongoose';

const blogSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    content: { type: String, required: true },
    description: String, // New description field
    excerpt: String,
    image: String,
    author: String,
    tags: [String],
    published: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export default mongoose.models.Blog || mongoose.model('Blog', blogSchema);
