const mongoose = require('mongoose');
const Assignment = require('../models/Assignment');
const Subject = require('../models/Subject');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const removeDuplicates = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Get all assignments
    const assignments = await Assignment.find({})
      .populate('subject', 'name')
      .sort({ createdAt: 1 }); // Keep oldest ones

    console.log(`📊 Total assignments found: ${assignments.length}`);

    // Group assignments by title + subject + dueDate
    const groupedAssignments = {};
    
    assignments.forEach(assignment => {
      const key = `${assignment.title}|${assignment.subject?._id}|${assignment.dueDate}`;
      
      if (!groupedAssignments[key]) {
        groupedAssignments[key] = [];
      }
      groupedAssignments[key].push(assignment);
    });

    // Find and remove duplicates
    let totalRemoved = 0;
    
    for (const key in groupedAssignments) {
      const group = groupedAssignments[key];
      
      if (group.length > 1) {
        console.log(`\n🔍 Found ${group.length} duplicates for:`);
        console.log(`   Title: ${group[0].title}`);
        console.log(`   Subject: ${group[0].subject?.name || 'N/A'}`);
        console.log(`   Due Date: ${group[0].dueDate}`);
        
        // Keep the first one (oldest), remove the rest
        const toKeep = group[0];
        const toRemove = group.slice(1);
        
        console.log(`   ✅ Keeping: ${toKeep._id} (Created: ${toKeep.createdAt})`);
        
        for (const duplicate of toRemove) {
          console.log(`   ❌ Removing: ${duplicate._id} (Created: ${duplicate.createdAt})`);
          await Assignment.findByIdAndDelete(duplicate._id);
          totalRemoved++;
        }
      }
    }

    console.log(`\n✅ Cleanup complete!`);
    console.log(`📊 Total duplicates removed: ${totalRemoved}`);
    console.log(`📊 Remaining assignments: ${assignments.length - totalRemoved}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
};

removeDuplicates();
