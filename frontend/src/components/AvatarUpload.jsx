import React, { useState, useRef } from 'react';
import { Modal, Button, Form, Image } from 'react-bootstrap';
import axios from 'axios';
import { toast } from 'react-toastify';

const AvatarUpload = ({ show, onHide, currentAvatar, onUploadSuccess }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(currentAvatar);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef();

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }

      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size must be less than 5MB');
        return;
      }

      setSelectedFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('Please select an image first');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('avatar', selectedFile);

      const token = localStorage.getItem('token');
      const { data } = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/avatar/upload`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      toast.success('Avatar uploaded successfully!');
      
      // Update user in localStorage
      const user = JSON.parse(localStorage.getItem('user'));
      user.avatar = data.avatar;
      localStorage.setItem('user', JSON.stringify(user));

      if (onUploadSuccess) {
        onUploadSuccess(data.avatar);
      }

      onHide();
      setSelectedFile(null);
      setPreview(null);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to upload avatar');
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(
        `${import.meta.env.VITE_API_URL}/api/avatar`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success('Avatar removed successfully!');
      
      // Update user in localStorage
      const user = JSON.parse(localStorage.getItem('user'));
      user.avatar = '';
      localStorage.setItem('user', JSON.stringify(user));

      if (onUploadSuccess) {
        onUploadSuccess('');
      }

      onHide();
      setSelectedFile(null);
      setPreview(null);
    } catch (error) {
      toast.error('Failed to remove avatar');
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>Upload Avatar</Modal.Title>
      </Modal.Header>
      <Modal.Body className="text-center">
        <div className="mb-4">
          <Image
            src={preview || 'https://via.placeholder.com/200?text=No+Avatar'}
            roundedCircle
            style={{ width: '200px', height: '200px', objectFit: 'cover' }}
          />
        </div>

        <Form.Group>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
          <Button
            variant="outline-primary"
            onClick={() => fileInputRef.current.click()}
            className="mb-2 w-100"
          >
            <i className="bi bi-image me-2"></i>
            Choose Image
          </Button>
        </Form.Group>

        {selectedFile && (
          <small className="text-muted d-block mb-3">
            Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
          </small>
        )}

        <small className="text-muted d-block">
          Supported formats: JPG, PNG, GIF, WebP (Max 5MB)
        </small>
      </Modal.Body>
      <Modal.Footer className="d-flex justify-content-between">
        {currentAvatar && (
          <Button variant="danger" onClick={handleRemove}>
            Remove Avatar
          </Button>
        )}
        <div className="ms-auto">
          <Button variant="secondary" onClick={onHide} className="me-2">
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleUpload}
            disabled={!selectedFile || uploading}
          >
            {uploading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" />
                Uploading...
              </>
            ) : (
              'Upload'
            )}
          </Button>
        </div>
      </Modal.Footer>
    </Modal>
  );
};

export default AvatarUpload;
