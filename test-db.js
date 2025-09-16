const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/axion');

// Import models
const Product = require('./src/models/Products').default;
const Category = require('./src/models/Category').default;

async function checkDatabase() {
  try {
    console.log('Checking database...\n');

    // Check categories
    const categories = await Category.find({});
    console.log(`Categories found: ${categories.length}`);
    categories.forEach((cat) => {
      console.log(`- ${cat.name} (${cat.slug})`);
    });

    console.log('\n---\n');

    // Check products
    const products = await Product.find({});
    console.log(`Products found: ${products.length}`);
    products.forEach((product) => {
      console.log(
        `- ${product.name} (${product.slug}) - Featured: ${product.featured} - Price: $${product.price}`,
      );
    });

    console.log('\n---\n');

    // Check featured products specifically
    const featuredProducts = await Product.find({ featured: true });
    console.log(`Featured products found: ${featuredProducts.length}`);
    featuredProducts.forEach((product) => {
      console.log(`- ${product.name} (${product.slug}) - Price: $${product.price}`);
    });
  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.disconnect();
  }
}

checkDatabase();
