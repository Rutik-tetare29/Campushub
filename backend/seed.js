const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./models/User');

const seedUsers = async () => {
  try {
    const MONGO = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/campus_connect';
    await mongoose.connect(MONGO);
    console.log('MongoDB connected');

    // Check if users already exist
    const adminExists = await User.findOne({ email: 'admin@campus.edu' });
    const teacherExists = await User.findOne({ email: 'teacher@campus.edu' });

    if (!adminExists) {
      const adminPassword = await bcrypt.hash('admin123', 10);
      const admin = new User({
        name: 'Admin User',
        email: 'admin@campus.edu',
        password: adminPassword,
        role: 'admin'
      });
      await admin.save();
      console.log('✅ Admin user created: admin@campus.edu / admin123');
    } else {
      console.log('⚠️  Admin user already exists');
    }

    if (!teacherExists) {
      const teacherPassword = await bcrypt.hash('teacher123', 10);
      const teacher = new User({
        name: 'John Teacher',
        email: 'teacher@campus.edu',
        password: teacherPassword,
        role: 'teacher'
      });
      await teacher.save();
      console.log('✅ Teacher user created: teacher@campus.edu / teacher123');
    } else {
      console.log('⚠️  Teacher user already exists');
    }

    console.log('\n🎉 Seed complete! You can now login with:');
    console.log('   Admin:   admin@campus.edu / admin123');
    console.log('   Teacher: teacher@campus.edu / teacher123');
    
    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
};

seedUsers();
