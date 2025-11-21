const User = require('../models/User');
const Subject = require('../models/Subject');
const Assignment = require('../models/Assignment');
const Submission = require('../models/Submission');
const Grade = require('../models/Grade');
const Attendance = require('../models/Attendance');
const Schedule = require('../models/Schedule');
const Upload = require('../models/Upload');
const Notice = require('../models/Notice');

/**
 * Get dashboard overview statistics
 * @param {string} userId - User ID
 * @param {string} role - User role
 * @returns {Promise<Object>} - Overview stats
 */
const getDashboardOverview = async (userId, role) => {
  try {
    let overview = {};

    switch (role) {
      case 'admin':
        overview = await getAdminOverview();
        break;
      case 'teacher':
        overview = await getTeacherOverview(userId);
        break;
      case 'student':
        overview = await getStudentOverview(userId);
        break;
      default:
        throw new Error('Invalid role');
    }

    return overview;
  } catch (error) {
    console.error('Error getting dashboard overview:', error);
    throw error;
  }
};

/**
 * Get admin dashboard overview
 * @returns {Promise<Object>} - Admin overview
 */
const getAdminOverview = async () => {
  const [
    totalStudents,
    totalTeachers,
    totalSubjects,
    totalAssignments,
    activeUsers,
    recentNotices
  ] = await Promise.all([
    User.countDocuments({ role: 'student' }),
    User.countDocuments({ role: 'teacher' }),
    Subject.countDocuments(),
    Assignment.countDocuments(),
    User.countDocuments({ isActive: true }),
    Notice.countDocuments({ createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } })
  ]);

  return {
    totalStudents,
    totalTeachers,
    totalSubjects,
    totalAssignments,
    activeUsers,
    recentNotices
  };
};

/**
 * Get teacher dashboard overview
 * @param {string} teacherId - Teacher ID
 * @returns {Promise<Object>} - Teacher overview
 */
const getTeacherOverview = async (teacherId) => {
  const [
    mySubjects,
    totalAssignments,
    pendingSubmissions,
    studentsCount
  ] = await Promise.all([
    Schedule.countDocuments({ teacher: teacherId }),
    Assignment.countDocuments({ createdBy: teacherId }),
    Submission.countDocuments({ status: 'submitted' }),
    Schedule.find({ teacher: teacherId }).distinct('students').then(ids => ids.length)
  ]);

  return {
    mySubjects,
    totalAssignments,
    pendingSubmissions,
    studentsCount
  };
};

/**
 * Get student dashboard overview
 * @param {string} studentId - Student ID
 * @returns {Promise<Object>} - Student overview
 */
const getStudentOverview = async (studentId) => {
  const [
    enrolledSubjects,
    pendingAssignments,
    avgGrade,
    attendanceRate
  ] = await Promise.all([
    Schedule.countDocuments({ students: studentId }),
    Assignment.countDocuments({
      dueDate: { $gte: new Date() },
      status: 'published'
    }),
    calculateStudentAvgGPA(studentId),
    calculateStudentAttendanceRate(studentId)
  ]);

  return {
    enrolledSubjects,
    pendingAssignments,
    avgGrade,
    attendanceRate
  };
};

/**
 * Calculate student average GPA
 * @param {string} studentId - Student ID
 * @returns {Promise<number>} - Average GPA
 */
const calculateStudentAvgGPA = async (studentId) => {
  const result = await Grade.aggregate([
    { $match: { student: studentId } },
    { $group: { _id: null, avgGPA: { $avg: '$gpa' } } }
  ]);

  return result.length > 0 ? parseFloat(result[0].avgGPA.toFixed(2)) : 0;
};

/**
 * Calculate student attendance rate
 * @param {string} studentId - Student ID
 * @returns {Promise<number>} - Attendance rate percentage
 */
const calculateStudentAttendanceRate = async (studentId) => {
  const [totalClasses, presentCount] = await Promise.all([
    Attendance.countDocuments({ student: studentId }),
    Attendance.countDocuments({ student: studentId, status: 'present' })
  ]);

  return totalClasses > 0 ? parseFloat(((presentCount / totalClasses) * 100).toFixed(2)) : 0;
};

/**
 * Get attendance analytics
 * @param {Object} filters - Filters
 * @returns {Promise<Object>} - Attendance analytics
 */
const getAttendanceAnalytics = async (filters = {}) => {
  try {
    const { subjectId, studentId, startDate, endDate } = filters;

    const matchQuery = {};
    if (subjectId) matchQuery.subject = subjectId;
    if (studentId) matchQuery.student = studentId;
    if (startDate && endDate) {
      matchQuery.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    const [statusDistribution, dailyTrend, lowAttendanceStudents] = await Promise.all([
      // Status distribution
      Attendance.aggregate([
        { $match: matchQuery },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      
      // Daily attendance trend
      Attendance.aggregate([
        { $match: matchQuery },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
            present: {
              $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] }
            },
            total: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } },
        { $limit: 30 }
      ]),

      // Students with low attendance
      Attendance.aggregate([
        { $match: matchQuery },
        {
          $group: {
            _id: '$student',
            total: { $sum: 1 },
            present: {
              $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] }
            }
          }
        },
        {
          $project: {
            student: '$_id',
            attendanceRate: {
              $multiply: [{ $divide: ['$present', '$total'] }, 100]
            }
          }
        },
        { $match: { attendanceRate: { $lt: 75 } } },
        { $sort: { attendanceRate: 1 } },
        { $limit: 10 }
      ])
    ]);

    // Populate student details
    const populatedLowAttendance = await User.populate(lowAttendanceStudents, {
      path: 'student',
      select: 'name email rollNumber'
    });

    return {
      statusDistribution,
      dailyTrend,
      lowAttendanceStudents: populatedLowAttendance
    };
  } catch (error) {
    console.error('Error getting attendance analytics:', error);
    throw error;
  }
};

/**
 * Get grade analytics
 * @param {Object} filters - Filters
 * @returns {Promise<Object>} - Grade analytics
 */
const getGradeAnalytics = async (filters = {}) => {
  try {
    const { subjectId, semester, academicYear } = filters;

    const matchQuery = {};
    if (subjectId) matchQuery.subject = subjectId;
    if (semester) matchQuery.semester = semester;
    if (academicYear) matchQuery.academicYear = academicYear;

    const [gradeDistribution, avgScores, topPerformers] = await Promise.all([
      // Grade distribution
      Grade.aggregate([
        { $match: matchQuery },
        { $group: { _id: '$letterGrade', count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ]),

      // Average scores by component
      Grade.aggregate([
        { $match: matchQuery },
        {
          $group: {
            _id: null,
            avgAssignments: { $avg: '$assignments' },
            avgMidterm: { $avg: '$midterm' },
            avgFinal: { $avg: '$final' },
            avgTotal: { $avg: '$totalScore' },
            avgGPA: { $avg: '$gpa' }
          }
        }
      ]),

      // Top performers
      Grade.aggregate([
        { $match: matchQuery },
        { $sort: { gpa: -1 } },
        { $limit: 10 },
        {
          $lookup: {
            from: 'users',
            localField: 'student',
            foreignField: '_id',
            as: 'studentInfo'
          }
        },
        { $unwind: '$studentInfo' },
        {
          $project: {
            student: '$studentInfo.name',
            email: '$studentInfo.email',
            gpa: 1,
            letterGrade: 1,
            totalScore: 1
          }
        }
      ])
    ]);

    return {
      gradeDistribution,
      avgScores: avgScores[0] || {},
      topPerformers
    };
  } catch (error) {
    console.error('Error getting grade analytics:', error);
    throw error;
  }
};

/**
 * Get assignment analytics
 * @param {Object} filters - Filters
 * @returns {Promise<Object>} - Assignment analytics
 */
const getAssignmentAnalytics = async (filters = {}) => {
  try {
    const { subjectId, teacherId } = filters;

    const matchQuery = {};
    if (subjectId) matchQuery.subject = subjectId;
    if (teacherId) matchQuery.createdBy = teacherId;

    const [submissionStats, lateSubmissions, avgScores] = await Promise.all([
      // Submission statistics
      Assignment.aggregate([
        { $match: matchQuery },
        {
          $lookup: {
            from: 'submissions',
            localField: '_id',
            foreignField: 'assignment',
            as: 'submissions'
          }
        },
        {
          $project: {
            title: 1,
            totalSubmissions: { $size: '$submissions' },
            gradedSubmissions: {
              $size: {
                $filter: {
                  input: '$submissions',
                  as: 'sub',
                  cond: { $ne: ['$$sub.grade', null] }
                }
              }
            },
            lateSubmissions: {
              $size: {
                $filter: {
                  input: '$submissions',
                  as: 'sub',
                  cond: { $eq: ['$$sub.isLate', true] }
                }
              }
            }
          }
        }
      ]),

      // Late submission rate
      Submission.aggregate([
        {
          $lookup: {
            from: 'assignments',
            localField: 'assignment',
            foreignField: '_id',
            as: 'assignmentInfo'
          }
        },
        { $unwind: '$assignmentInfo' },
        { $match: { 'assignmentInfo.createdBy': teacherId } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            late: { $sum: { $cond: ['$isLate', 1, 0] } }
          }
        }
      ]),

      // Average scores
      Submission.aggregate([
        {
          $lookup: {
            from: 'assignments',
            localField: 'assignment',
            foreignField: '_id',
            as: 'assignmentInfo'
          }
        },
        { $unwind: '$assignmentInfo' },
        { $match: { grade: { $ne: null } } },
        {
          $group: {
            _id: '$assignment',
            title: { $first: '$assignmentInfo.title' },
            avgScore: { $avg: '$grade' },
            maxScore: { $first: '$assignmentInfo.maxScore' }
          }
        }
      ])
    ]);

    return {
      submissionStats,
      lateSubmissionRate: lateSubmissions[0] || { total: 0, late: 0 },
      avgScores
    };
  } catch (error) {
    console.error('Error getting assignment analytics:', error);
    throw error;
  }
};

/**
 * Get subject performance analytics
 * @param {string} subjectId - Subject ID
 * @returns {Promise<Object>} - Subject analytics
 */
const getSubjectAnalytics = async (subjectId) => {
  try {
    const [enrollmentCount, avgGrade, assignmentCount, attendanceAvg] = await Promise.all([
      Schedule.find({ subject: subjectId }).distinct('students').then(ids => ids.length),
      
      Grade.aggregate([
        { $match: { subject: subjectId } },
        { $group: { _id: null, avgGPA: { $avg: '$gpa' } } }
      ]),

      Assignment.countDocuments({ subject: subjectId }),

      Attendance.aggregate([
        { $match: { subject: subjectId } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            present: {
              $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] }
            }
          }
        }
      ])
    ]);

    return {
      enrollmentCount,
      avgGrade: avgGrade[0]?.avgGPA || 0,
      assignmentCount,
      attendanceRate: attendanceAvg[0] 
        ? ((attendanceAvg[0].present / attendanceAvg[0].total) * 100).toFixed(2)
        : 0
    };
  } catch (error) {
    console.error('Error getting subject analytics:', error);
    throw error;
  }
};

/**
 * Get user activity analytics
 * @param {string} userId - User ID
 * @param {number} days - Number of days
 * @returns {Promise<Object>} - Activity analytics
 */
const getUserActivityAnalytics = async (userId, days = 30) => {
  try {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const [uploads, submissions, logins] = await Promise.all([
      Upload.countDocuments({
        uploadedBy: userId,
        createdAt: { $gte: startDate }
      }),

      Submission.countDocuments({
        student: userId,
        submittedAt: { $gte: startDate }
      }),

      User.findById(userId).select('lastLogin')
    ]);

    return {
      uploads,
      submissions,
      lastLogin: logins?.lastLogin,
      period: `${days} days`
    };
  } catch (error) {
    console.error('Error getting user activity:', error);
    throw error;
  }
};

/**
 * Export analytics data to CSV format
 * @param {string} type - Analytics type
 * @param {Object} filters - Filters
 * @returns {Promise<Array>} - CSV data
 */
const exportAnalyticsData = async (type, filters = {}) => {
  try {
    let data = [];

    switch (type) {
      case 'grades':
        data = await Grade.find(filters)
          .populate('student', 'name email rollNumber')
          .populate('subject', 'name code')
          .lean();
        break;
      
      case 'attendance':
        data = await Attendance.find(filters)
          .populate('student', 'name rollNumber')
          .populate('subject', 'name code')
          .lean();
        break;

      case 'submissions':
        data = await Submission.find(filters)
          .populate('student', 'name rollNumber')
          .populate('assignment', 'title')
          .lean();
        break;

      default:
        throw new Error('Invalid export type');
    }

    return data;
  } catch (error) {
    console.error('Error exporting analytics data:', error);
    throw error;
  }
};

module.exports = {
  getDashboardOverview,
  getAttendanceAnalytics,
  getGradeAnalytics,
  getAssignmentAnalytics,
  getSubjectAnalytics,
  getUserActivityAnalytics,
  exportAnalyticsData
};
