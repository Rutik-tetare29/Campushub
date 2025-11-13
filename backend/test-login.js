const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./models/User');

const testLogin = async () => {
  try {
    const MONGO = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/campus_connect';
    await mongoose.connect(MONGO);
    console.log('MongoDB connected\n');

    // Test teacher login
    console.log('Testing teacher@campus.edu...');
    const teacher = await User.findOne({ email: 'teacher@campus.edu' });
    
    if (teacher) {
      console.log('✅ User found in database');
      console.log('   Name:', teacher.name);
      console.log('   Email:', teacher.email);
      console.log('   Role:', teacher.role);
      console.log('   Password hash:', teacher.password.substring(0, 20) + '...');
      
      const match = await bcrypt.compare('teacher123', teacher.password);
      console.log('   Password match:', match ? '✅ YES' : '❌ NO');
    } else {
      console.log('❌ User not found in database');
    }

    console.log('\nTesting admin@campus.edu...');
    const admin = await User.findOne({ email: 'admin@campus.edu' });
    
    if (admin) {
      console.log('✅ User found in database');
      console.log('   Name:', admin.name);
      console.log('   Email:', admin.email);
      console.log('   Role:', admin.role);
      console.log('   Password hash:', admin.password.substring(0, 20) + '...');
      
      const match = await bcrypt.compare('admin123', admin.password);
      console.log('   Password match:', match ? '✅ YES' : '❌ NO');
    } else {
      console.log('❌ User not found in database');
    }

    process.exit(0);
  } catch (err) {
    console.error('Test error:', err);
    process.exit(1);
  }
};

testLogin();
