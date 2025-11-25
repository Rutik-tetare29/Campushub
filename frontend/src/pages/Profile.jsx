import React, { useState, useEffect } from 'react'
import API from '../api'
import AvatarUpload from '../components/AvatarUpload'
import StudentQRDisplay from '../components/StudentQRDisplay'
import '../styles/Profile.css'

export default function Profile() {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user')) } catch { return null }
  })
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editMode, setEditMode] = useState(false)
  const [passwordDialog, setPasswordDialog] = useState(false)
  const [showAvatarUpload, setShowAvatarUpload] = useState(false)
  const [formData, setFormData] = useState({})
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [message, setMessage] = useState({ type: '', text: '' })
  const [activityStats, setActivityStats] = useState({
    subjects: 0,
    uploads: 0,
    notices: 0
  })

  useEffect(() => {
    fetchProfile()
    fetchActivityStats()
  }, [])

  const fetchActivityStats = async () => {
    try {
      const userId = user._id || user.id
      
      // Fetch real activity data
      const [subjectsRes, uploadsRes, noticesRes] = await Promise.all([
        API.get('/subjects').catch(() => ({ data: [] })),
        API.get('/upload').catch(() => ({ data: [] })),
        API.get('/notices').catch(() => ({ data: [] }))
      ])
      
      // Filter user's own uploads
      const userUploads = uploadsRes.data.filter(upload => 
        upload.uploadedBy?._id === userId || upload.uploadedBy?.id === userId
      )
      
      // Filter user's own notices (for teachers/admins)
      const userNotices = noticesRes.data.filter(notice => 
        notice.createdBy?._id === userId || notice.createdBy?.id === userId
      )
      
      setActivityStats({
        subjects: subjectsRes.data.length,
        uploads: userUploads.length,
        notices: user.role === 'teacher' || user.role === 'admin' ? userNotices.length : noticesRes.data.length
      })
    } catch (err) {
      console.error('Failed to fetch activity stats:', err)
    }
  }

  const fetchProfile = async () => {
    try {
      // Get user ID - could be stored as id or _id
      const userId = user._id || user.id
      if (!userId) {
        setMessage({ type: 'error', text: 'User ID not found. Please login again.' })
        setLoading(false)
        return
      }
      
      const res = await API.get(`/users/profile/${userId}`)
      setProfile(res.data)
      
      // Format date of birth for input field (YYYY-MM-DD)
      const formattedData = { ...res.data }
      if (formattedData.dateOfBirth) {
        formattedData.dateOfBirth = new Date(formattedData.dateOfBirth).toISOString().split('T')[0]
      }
      
      setFormData(formattedData)
      setLoading(false)
      
      // Check if profile is incomplete
      const isIncomplete = !res.data.phone || !res.data.address
      if (isIncomplete && !editMode) {
        setMessage({ 
          type: 'info', 
          text: '👋 Welcome! Please complete your profile by clicking "Edit Profile" button above.' 
        })
      }
    } catch (err) {
      console.error('Failed to fetch profile:', err)
      setMessage({ type: 'error', text: 'Failed to load profile' })
      setLoading(false)
    }
  }

  const handleUpdateProfile = async () => {
    try {
      const userId = user._id || user.id
      const res = await API.put(`/users/profile/${userId}`, formData)
      setProfile(res.data)
      
      // Update localStorage
      const updatedUser = { ...user, name: res.data.name, email: res.data.email }
      localStorage.setItem('user', JSON.stringify(updatedUser))
      setUser(updatedUser)
      
      setEditMode(false)
      setMessage({ type: 'success', text: 'Profile updated successfully!' })
      setTimeout(() => setMessage({ type: '', text: '' }), 3000)
    } catch (err) {
      setMessage({ type: 'error', text: err?.response?.data?.message || 'Failed to update profile' })
    }
  }

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' })
      return
    }
    if (passwordData.newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters' })
      return
    }

    try {
      const userId = user._id || user.id
      await API.put(`/users/password/${userId}`, {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      })
      setPasswordDialog(false)
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setMessage({ type: 'success', text: 'Password changed successfully!' })
      setTimeout(() => setMessage({ type: '', text: '' }), 3000)
    } catch (err) {
      setMessage({ type: 'error', text: err?.response?.data?.message || 'Failed to change password' })
    }
  }

  if (loading) {
    return (
      <div className="container mt-5">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 text-muted">Loading profile...</p>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="container mt-5">
        <div className="alert alert-danger" role="alert">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          Failed to load profile. Please try again.
        </div>
      </div>
    )
  }

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return 'danger'
      case 'teacher': return 'primary'
      case 'student': return 'success'
      default: return 'secondary'
    }
  }

  const getRoleBadge = (role) => {
    const colors = {
      admin: { bg: 'danger', icon: 'bi-shield-fill-check' },
      teacher: { bg: 'primary', icon: 'bi-person-video3' },
      student: { bg: 'success', icon: 'bi-mortarboard-fill' }
    }
    return colors[role] || { bg: 'secondary', icon: 'bi-person-circle' }
  }

  return (
    <div className="profile-page">
      <div className="container-fluid px-4 py-4">
        {/* Alert Messages */}
        {message.text && (
          <div className={`alert alert-${message.type === 'error' ? 'danger' : message.type} alert-dismissible fade show`} role="alert">
            <i className={`bi ${message.type === 'success' ? 'bi-check-circle-fill' : message.type === 'error' ? 'bi-exclamation-triangle-fill' : 'bi-info-circle-fill'} me-2`}></i>
            {message.text}
            <button type="button" className="btn-close" onClick={() => setMessage({ type: '', text: '' })}></button>
          </div>
        )}

        {/* Edit Mode Banner */}
        {editMode && (
          <div className="alert alert-warning alert-dismissible fade show" role="alert">
            <div className="d-flex align-items-center">
              <i className="bi bi-pencil-square fs-4 me-3"></i>
              <div>
                <h6 className="mb-1 fw-bold">Edit Mode Active</h6>
                <small>Make your changes below and click "Save Changes" to update your profile.</small>
              </div>
            </div>
            <button type="button" className="btn-close" onClick={() => {
              setEditMode(false)
              setFormData(profile)
              setMessage({ type: '', text: '' })
            }}></button>
          </div>
        )}

        {/* Profile Header */}
        <div className="card profile-header-card border-0 shadow-lg mb-4">
          <div className="profile-cover"></div>
          <div className="card-body position-relative">
            <div className="row align-items-end">
              <div className="col-lg-8">
                <div className="d-flex align-items-center gap-4">
                  <div className="profile-avatar-wrapper" style={{ position: 'relative' }}>
                    {profile.avatar ? (
                      <img
                        src={`${import.meta.env.VITE_API_URL}${profile.avatar}`}
                        alt="Avatar"
                        className="profile-avatar"
                        style={{ 
                          width: '120px', 
                          height: '120px', 
                          borderRadius: '50%',
                          objectFit: 'cover',
                          border: '4px solid white',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                        }}
                      />
                    ) : (
                      <div className="profile-avatar">
                        {profile.name?.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <button
                      className="btn btn-sm btn-primary rounded-circle"
                      style={{
                        position: 'absolute',
                        bottom: '0',
                        right: '0',
                        width: '36px',
                        height: '36px',
                        padding: '0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      onClick={() => setShowAvatarUpload(true)}
                      title="Change avatar"
                    >
                      <i className="bi bi-camera-fill"></i>
                    </button>
                    <span className={`status-indicator bg-${getRoleColor(profile.role)}`}></span>
                  </div>
                  <div className="profile-info mt-5">
                    <h2 className="fw-bold mb-2">{profile.name}</h2>
                    <div className="d-flex flex-wrap gap-2 align-items-center">
                      <span className={`badge bg-${getRoleBadge(profile.role).bg} px-3 py-2`}>
                        <i className={`bi ${getRoleBadge(profile.role).icon} me-2`}></i>
                        {profile.role?.toUpperCase()}
                      </span>
                      <span className="text-muted">
                        <i className="bi bi-envelope-fill me-2"></i>
                        {profile.email}
                      </span>
                      <span className="text-muted">
                        <i className="bi bi-calendar-check me-2"></i>
                        Member since {new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-lg-4 text-lg-end mt-3 mt-lg-0">
                {!editMode ? (
                  <button className="btn btn-primary btn-lg px-4 shadow-sm" onClick={() => {
                    setEditMode(true)
                    setMessage({ type: 'info', text: '✏️ Edit mode enabled! Update your information and click Save Changes.' })
                  }}>
                    <i className="bi bi-pencil-square me-2"></i>
                    Edit Profile
                  </button>
                ) : (
                  <div className="d-flex gap-2 justify-content-lg-end">
                    <button className="btn btn-success btn-lg px-4 shadow-sm" onClick={handleUpdateProfile}>
                      <i className="bi bi-check-lg me-2"></i>
                      Save Changes
                    </button>
                    <button className="btn btn-secondary btn-lg px-4 shadow-sm" onClick={() => {
                      setEditMode(false)
                      setFormData(profile)
                      setMessage({ type: '', text: '' })
                    }}>
                      <i className="bi bi-x-lg me-2"></i>
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="row g-4">
          {/* Main Content - Personal Information */}
          <div className="col-lg-8">
            <div className="card border-0 shadow-sm">
              <div className="card-header bg-white border-0 py-3">
                <h5 className="mb-0 fw-bold">
                  <i className="bi bi-person-circle text-primary me-2"></i>
                  Personal Information
                </h5>
              </div>
              <div className="card-body p-4">
                <div className="row g-4">
                  {/* Name */}
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">
                      <i className="bi bi-person-fill text-muted me-2"></i>
                      Full Name
                    </label>
                    <input
                      type="text"
                      className="form-control form-control-lg"
                      value={formData.name || ''}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      disabled={!editMode}
                      placeholder="Enter your full name"
                    />
                  </div>

                  {/* Email */}
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">
                      <i className="bi bi-envelope-fill text-muted me-2"></i>
                      Email Address
                    </label>
                    <input
                      type="email"
                      className="form-control form-control-lg"
                      value={formData.email || ''}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      disabled={!editMode}
                      placeholder="your.email@example.com"
                    />
                  </div>

                  {/* Phone */}
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">
                      <i className="bi bi-telephone-fill text-muted me-2"></i>
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      className="form-control form-control-lg"
                      value={formData.phone || ''}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      disabled={!editMode}
                      placeholder="+1 (555) 000-0000"
                    />
                  </div>

                  {/* Date of Birth */}
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">
                      <i className="bi bi-cake2-fill text-muted me-2"></i>
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      className="form-control form-control-lg"
                      value={formData.dateOfBirth || ''}
                      onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                      disabled={!editMode}
                    />
                  </div>

                  {/* Address */}
                  <div className="col-12">
                    <label className="form-label fw-semibold">
                      <i className="bi bi-geo-alt-fill text-muted me-2"></i>
                      Address
                    </label>
                    <textarea
                      className="form-control form-control-lg"
                      rows="2"
                      value={formData.address || ''}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      disabled={!editMode}
                      placeholder="Enter your complete address"
                    ></textarea>
                  </div>

                  {/* Role-Specific Fields - Student */}
                  {profile.role === 'student' && (
                    <>
                      <div className="col-12">
                        <hr className="my-2" />
                        <h6 className="text-muted mb-3">
                          <i className="bi bi-mortarboard-fill me-2"></i>
                          Student Details
                        </h6>
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">
                          <i className="bi bi-card-text text-muted me-2"></i>
                          Student ID
                        </label>
                        <input
                          type="text"
                          className="form-control form-control-lg"
                          value={formData.studentId || ''}
                          onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                          disabled={!editMode}
                          placeholder="STU-XXXX"
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">
                          <i className="bi bi-calendar-event text-muted me-2"></i>
                          Enrollment Year
                        </label>
                        <input
                          type="text"
                          className="form-control form-control-lg"
                          value={formData.enrollmentYear || ''}
                          onChange={(e) => setFormData({ ...formData, enrollmentYear: e.target.value })}
                          disabled={!editMode}
                          placeholder="2024"
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">
                          <i className="bi bi-building text-muted me-2"></i>
                          Department
                        </label>
                        <input
                          type="text"
                          className="form-control form-control-lg"
                          value={formData.department || ''}
                          onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                          disabled={!editMode}
                          placeholder="Computer Science"
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">
                          <i className="bi bi-book-half text-muted me-2"></i>
                          Current Semester
                        </label>
                        <input
                          type="text"
                          className="form-control form-control-lg"
                          value={formData.semester || ''}
                          onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                          disabled={!editMode}
                          placeholder="5th Semester"
                        />
                      </div>
                    </>
                  )}

                  {/* Role-Specific Fields - Teacher */}
                  {profile.role === 'teacher' && (
                    <>
                      <div className="col-12">
                        <hr className="my-2" />
                        <h6 className="text-muted mb-3">
                          <i className="bi bi-person-video3 me-2"></i>
                          Faculty Details
                        </h6>
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">
                          <i className="bi bi-card-text text-muted me-2"></i>
                          Employee ID
                        </label>
                        <input
                          type="text"
                          className="form-control form-control-lg"
                          value={formData.employeeId || ''}
                          onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                          disabled={!editMode}
                          placeholder="EMP-XXXX"
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">
                          <i className="bi bi-building text-muted me-2"></i>
                          Department
                        </label>
                        <input
                          type="text"
                          className="form-control form-control-lg"
                          value={formData.department || ''}
                          onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                          disabled={!editMode}
                          placeholder="Computer Science"
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">
                          <i className="bi bi-award-fill text-muted me-2"></i>
                          Designation
                        </label>
                        <input
                          type="text"
                          className="form-control form-control-lg"
                          value={formData.designation || ''}
                          onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                          disabled={!editMode}
                          placeholder="Assistant Professor"
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">
                          <i className="bi bi-star-fill text-muted me-2"></i>
                          Specialization
                        </label>
                        <input
                          type="text"
                          className="form-control form-control-lg"
                          value={formData.specialization || ''}
                          onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                          disabled={!editMode}
                          placeholder="Machine Learning"
                        />
                      </div>
                    </>
                  )}

                  {/* Role-Specific Fields - Admin */}
                  {profile.role === 'admin' && (
                    <>
                      <div className="col-12">
                        <hr className="my-2" />
                        <h6 className="text-muted mb-3">
                          <i className="bi bi-shield-fill-check me-2"></i>
                          Administrator Details
                        </h6>
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">
                          <i className="bi bi-card-text text-muted me-2"></i>
                          Admin ID
                        </label>
                        <input
                          type="text"
                          className="form-control form-control-lg"
                          value={formData.adminId || ''}
                          onChange={(e) => setFormData({ ...formData, adminId: e.target.value })}
                          disabled={!editMode}
                          placeholder="ADM-XXXX"
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">
                          <i className="bi bi-shield-check text-muted me-2"></i>
                          Access Level
                        </label>
                        <input
                          type="text"
                          className="form-control form-control-lg"
                          value="Full Access"
                          disabled
                        />
                      </div>
                    </>
                  )}

                  {/* Bio */}
                  <div className="col-12">
                    <hr className="my-2" />
                    <label className="form-label fw-semibold">
                      <i className="bi bi-chat-left-text-fill text-muted me-2"></i>
                      Bio
                    </label>
                    <textarea
                      className="form-control form-control-lg"
                      rows="4"
                      value={formData.bio || ''}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                      disabled={!editMode}
                      placeholder="Tell us about yourself, your interests, and achievements..."
                    ></textarea>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="col-lg-4">
            {/* Security Card */}
            <div className="card border-0 shadow-sm mb-4">
              <div className="card-header bg-white border-0 py-3">
                <h5 className="mb-0 fw-bold">
                  <i className="bi bi-shield-lock-fill text-primary me-2"></i>
                  Security
                </h5>
              </div>
              <div className="card-body p-4">
                <button
                  className="btn btn-outline-primary btn-lg w-100"
                  onClick={() => setPasswordDialog(true)}
                >
                  <i className="bi bi-key-fill me-2"></i>
                  Change Password
                </button>
                <div className="mt-3 p-3 bg-light rounded">
                  <small className="text-muted">
                    <i className="bi bi-info-circle-fill me-2"></i>
                    Keep your account secure by using a strong password
                  </small>
                </div>
              </div>
            </div>

            {/* Activity Stats Card */}
            <div className="card border-0 shadow-sm mb-4">
              <div className="card-header bg-white border-0 py-3">
                <h5 className="mb-0 fw-bold">
                  <i className="bi bi-graph-up text-primary me-2"></i>
                  Activity Overview
                </h5>
              </div>
              <div className="card-body p-4">
                <div className="stat-item mb-3">
                  <div className="d-flex align-items-center justify-content-between">
                    <div className="d-flex align-items-center gap-3">
                      <div className="stat-icon bg-primary">
                        <i className="bi bi-book-fill"></i>
                      </div>
                      <div>
                        <h6 className="mb-0">{profile.role === 'teacher' ? 'Teaching' : 'Enrolled'}</h6>
                        <small className="text-muted">Subjects</small>
                      </div>
                    </div>
                    <h4 className="mb-0 fw-bold text-primary">{activityStats.subjects}</h4>
                  </div>
                </div>
                <hr />
                <div className="stat-item mb-3">
                  <div className="d-flex align-items-center justify-content-between">
                    <div className="d-flex align-items-center gap-3">
                      <div className="stat-icon bg-info">
                        <i className="bi bi-cloud-upload-fill"></i>
                      </div>
                      <div>
                        <h6 className="mb-0">Files</h6>
                        <small className="text-muted">Uploaded</small>
                      </div>
                    </div>
                    <h4 className="mb-0 fw-bold text-info">{activityStats.uploads}</h4>
                  </div>
                </div>
                <hr />
                <div className="stat-item">
                  <div className="d-flex align-items-center justify-content-between">
                    <div className="d-flex align-items-center gap-3">
                      <div className="stat-icon bg-warning">
                        <i className="bi bi-megaphone-fill"></i>
                      </div>
                      <div>
                        <h6 className="mb-0">{profile.role === 'teacher' || profile.role === 'admin' ? 'Posted' : 'Available'}</h6>
                        <small className="text-muted">Notices</small>
                      </div>
                    </div>
                    <h4 className="mb-0 fw-bold text-warning">{activityStats.notices}</h4>
                  </div>
                </div>
              </div>
            </div>

            {/* Student QR Code Card - Only for students */}
            {profile.role === 'student' && (
              <StudentQRDisplay studentId={profile._id || profile.id} />
            )}
          </div>
        </div>
      </div>

      {/* Change Password Modal */}
      <div className={`modal fade ${passwordDialog ? 'show d-block' : ''}`} tabIndex="-1" style={{ backgroundColor: passwordDialog ? 'rgba(0,0,0,0.5)' : 'transparent' }}>
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content border-0 shadow-lg">
            <div className="modal-header bg-primary text-white">
              <h5 className="modal-title fw-bold">
                <i className="bi bi-key-fill me-2"></i>
                Change Password
              </h5>
              <button type="button" className="btn-close btn-close-white" onClick={() => setPasswordDialog(false)}></button>
            </div>
            <div className="modal-body p-4">
              <div className="mb-3">
                <label className="form-label fw-semibold">Current Password</label>
                <div className="input-group">
                  <span className="input-group-text">
                    <i className="bi bi-lock-fill"></i>
                  </span>
                  <input
                    type="password"
                    className="form-control form-control-lg"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                    placeholder="Enter current password"
                  />
                </div>
              </div>
              <div className="mb-3">
                <label className="form-label fw-semibold">New Password</label>
                <div className="input-group">
                  <span className="input-group-text">
                    <i className="bi bi-shield-lock-fill"></i>
                  </span>
                  <input
                    type="password"
                    className="form-control form-control-lg"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    placeholder="Enter new password"
                  />
                </div>
                <small className="text-muted">Must be at least 6 characters</small>
              </div>
              <div className="mb-3">
                <label className="form-label fw-semibold">Confirm New Password</label>
                <div className="input-group">
                  <span className="input-group-text">
                    <i className="bi bi-shield-check"></i>
                  </span>
                  <input
                    type="password"
                    className="form-control form-control-lg"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    placeholder="Confirm new password"
                  />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary btn-lg" onClick={() => setPasswordDialog(false)}>
                <i className="bi bi-x-lg me-2"></i>
                Cancel
              </button>
              <button type="button" className="btn btn-primary btn-lg" onClick={handleChangePassword}>
                <i className="bi bi-check-lg me-2"></i>
                Change Password
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Avatar Upload Modal */}
      <AvatarUpload
        show={showAvatarUpload}
        onHide={() => setShowAvatarUpload(false)}
        currentAvatar={profile?.avatar}
        onUploadSuccess={(newAvatar) => {
          setProfile({ ...profile, avatar: newAvatar });
          fetchProfile();
        }}
      />
    </div>
  )
}
