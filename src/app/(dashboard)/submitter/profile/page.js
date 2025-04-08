'use client';

import { useState, useEffect, useRef } from 'react';
import { useUser } from '@/hooks/useUser';
import { useAuth } from '@/context/AuthContext';
import Image from 'next/image';

export default function SubmitterProfilePage() {
  const { user } = useUser();
  const { updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isHoveringImage, setIsHoveringImage] = useState(false);
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState({
    name: '',
    dateOfBirth: '',
    bio: '',
    phone: '',
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        dateOfBirth: user.dateOfBirth || '',
        bio: user.bio || '',
        phone: user.phone || '',
        email: user.email || '',
        password: ''
      });
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Format date from "YYYY-MM-DD" to "DD.MM.YYYY"
  const formatDateForDisplay = (dateString) => {
    if (!dateString) return '';
    
    try {
      const [year, month, day] = dateString.split('-');
      return `${day}.${month}.${year}`;
    } catch (error) {
      return dateString;
    }
  };

  // Format date from "DD.MM.YYYY" to "YYYY-MM-DD" for the date input
  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    
    try {
      const [day, month, year] = dateString.split('.');
      return `${year}-${month}-${day}`;
    } catch (error) {
      return '';
    }
  };

  const handleDateChange = (e) => {
    const dateValue = e.target.value; // Format: YYYY-MM-DD
    if (dateValue) {
      const [year, month, day] = dateValue.split('-');
      const formattedDate = `${day}.${month}.${year}`;
      setFormData({ ...formData, dateOfBirth: formattedDate });
    } else {
      setFormData({ ...formData, dateOfBirth: '' });
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setMessage({ text: '', type: '' });
    
    try {
      // Log data being sent for debugging
      console.log('Sending update data:', {
        ...formData,
        id: user.id,
        password: formData.password.trim() ? '[REDACTED]' : undefined
      });
      
      const response = await fetch('/API/updateUser', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          id: user.id,
          // Only include password if it's changed
          password: formData.password.trim() ? formData.password : undefined
        }),
      });
      
      const data = await response.json();
      console.log('Update response:', data);
      
      if (response.ok) {
        setMessage({ text: 'Profile updated successfully!', type: 'success' });
        setIsEditing(false);
        
        // Update user data in context
        if (data.user) {
          updateUser(data.user);
        }
      } else {
        setMessage({ 
          text: data.error || 'Failed to update profile', 
          type: 'error' 
        });
        console.error('Update error details:', data.details || 'No details provided');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage({ text: 'An error occurred while updating your profile', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;

    setIsUploadingImage(true);
    setMessage({ text: '', type: '' });

    const formData = new FormData();
    formData.append('userId', user.id);
    formData.append('file', file);

    try {
      const response = await fetch('/API/uploadImage', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ text: 'Profile image updated successfully!', type: 'success' });
        
        // Update user data in context
        if (data.user) {
          updateUser(data.user);
        }
      } else {
        setMessage({ text: data.error || 'Failed to update profile image', type: 'error' });
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      setMessage({ text: 'An error occurred while uploading your image', type: 'error' });
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Parse date of birth to display age
  const getAge = (dateOfBirth) => {
    if (!dateOfBirth) return '';
    
    try {
      const [day, month, year] = dateOfBirth.split('.').map(Number);
      const birthDate = new Date(year, month - 1, day);
      const today = new Date();
      
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      
      return `${age}`;
    } catch (error) {
      return '';
    }
  };

  return (
    <main style={{ 
      fontFamily: 'sans-serif', 
      backgroundColor: '#f9f3f3', 
      minHeight: '100vh',
      padding: '20px'
    }}>
      <div style={{
        minWidth: '1200px',
        margin: '0 auto',
        borderRadius: '8px',
        overflow: 'hidden',
        boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
        backgroundColor: 'white'
      }}>
        {/* Blue header with name and edit button */}
        <div style={{ 
          backgroundColor: '#4a90e2', 
          height: '200px',
          color: 'white',
          position: 'relative',
        }}>
          {/* Name and pencil positioned at the top */}
          <div style={{
            display: 'flex',
            width: '100%',
            padding: '20px 40px',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ flex: 1 }}></div> {/* Spacer */}
            <h1 style={{ 
              fontWeight: 'normal', 
              fontSize: '1.8rem',
              margin: 0,
              flex: 1,
              textAlign: 'center'
            }}>
              {user?.name || 'User'}
            </h1>
            <div style={{
              flex: 1,
              display: 'flex',
              justifyContent: 'flex-end'
            }}>
              {/* Edit button */}
              <div 
                style={{
                  cursor: 'pointer'
                }}
                onClick={() => setIsEditing(!isEditing)}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 17.25V21H6.75L17.81 9.94L14.06 6.19L3 17.25ZM20.71 7.04C21.1 6.65 21.1 6.02 20.71 5.63L18.37 3.29C17.98 2.9 17.35 2.9 16.96 3.29L15.13 5.12L18.88 8.87L20.71 7.04Z" fill="white"/>
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Content area */}
        <div style={{ 
          position: 'relative',
          marginTop: '-100px',
          padding: '0 20px 40px',
        }}>
          {/* Profile picture centered and overlapping */}
          <div style={{ 
            width: '200px',
            height: '200px',
            margin: '0 auto 40px',
            position: 'relative',
            zIndex: 10,
          }}>
            <div 
              style={{
                width: '100%',
                height: '100%',
                borderRadius: '50%',
                overflow: 'hidden',
                border: '5px solid white',
                boxSizing: 'border-box',
                position: 'relative',
                cursor: 'pointer'
              }}
              onClick={handleImageClick}
              onMouseEnter={() => setIsHoveringImage(true)}
              onMouseLeave={() => setIsHoveringImage(false)}
            >
              {isUploadingImage ? (
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'rgba(0,0,0,0.3)',
                  color: 'white',
                  zIndex: 1
                }}>
                  Uploading...
                </div>
              ) : (
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'rgba(0,0,0,0.5)',
                  color: 'white',
                  opacity: isHoveringImage ? 1 : 0,
                  transition: 'opacity 0.3s ease',
                  zIndex: 1,
                }}
                >
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M3 17.25V21H6.75L17.81 9.94L14.06 6.19L3 17.25ZM20.71 7.04C21.1 6.65 21.1 6.02 20.71 5.63L18.37 3.29C17.98 2.9 17.35 2.9 16.96 3.29L15.13 5.12L18.88 8.87L20.71 7.04Z" fill="white"/>
                    </svg>
                    Change Image
                  </div>
                </div>
              )}
              <Image 
                src={user?.image || "/human.jpeg"}
                alt="Profile"
                fill
                style={{ objectFit: 'cover' }}
                priority
              />
              <input 
                type="file" 
                ref={fileInputRef}
                style={{ display: 'none' }}
                accept="image/*"
                onChange={handleImageUpload}
              />
            </div>
          </div>

          {/* Status message */}
          {message.text && (
            <div style={{
              margin: '0 auto 20px',
              padding: '10px',
              borderRadius: '5px',
              maxWidth: '650px',
              textAlign: 'center',
              backgroundColor: message.type === 'success' ? '#d4edda' : '#f8d7da',
              color: message.type === 'success' ? '#155724' : '#721c24'
            }}>
              {message.text}
            </div>
          )}

          {/* Content with appropriate spacing */}
          <div style={{ 
            maxWidth: '650px', 
            margin: '0 auto',
            padding: '0 10px' 
          }}>
            {isEditing ? (
              /* Edit Form */
              <div style={{ padding: '20px 0' }}>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                    Name:
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: '4px',
                      border: '1px solid #ddd'
                    }}
                  />
                </div>
                
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                    Date of Birth:
                  </label>
                  <input
                    type="date"
                    name="dateOfBirthPicker"
                    value={formatDateForInput(formData.dateOfBirth)}
                    onChange={handleDateChange}
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: '4px',
                      border: '1px solid #ddd'
                    }}
                  />
                </div>
                
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                    Bio:
                  </label>
                  <textarea
                    name="bio"
                    value={formData.bio || ''}
                    onChange={handleChange}
                    rows="4"
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: '4px',
                      border: '1px solid #ddd',
                      resize: 'vertical'
                    }}
                  />
                </div>
                
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                    Email:
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: '4px',
                      border: '1px solid #ddd'
                    }}
                  />
                </div>
                
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                    Password (leave blank to keep current):
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: '4px',
                      border: '1px solid #ddd'
                    }}
                  />
                </div>
                
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                    Phone:
                  </label>
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone || ''}
                    onChange={handleChange}
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: '4px',
                      border: '1px solid #ddd'
                    }}
                  />
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '20px' }}>
                  <button
                    onClick={() => setIsEditing(false)}
                    style={{
                      padding: '10px 20px',
                      borderRadius: '4px',
                      border: 'none',
                      backgroundColor: '#f2f2f2',
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={loading}
                    style={{
                      padding: '10px 20px',
                      borderRadius: '4px',
                      border: 'none',
                      backgroundColor: '#4a90e2',
                      color: 'white',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      opacity: loading ? 0.7 : 1
                    }}
                  >
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            ) : (
              /* Display Profile */
              <>
                {/* Personal Info */}
                <div style={{
                  borderBottom: '1px solid #e0e0e0',
                  paddingBottom: '1rem',
                  marginBottom: '1rem',
                  textAlign: 'center'
                }}>
                  <p style={{ 
                    fontSize: '1.1rem', 
                    margin: '0.5rem 0',
                    fontWeight: 'normal'
                  }}>
                    Born: {user?.dateOfBirth || 'Not specified'} {user?.dateOfBirth ? `(age ${getAge(user.dateOfBirth)})` : ''}
                  </p>
                </div>

                {/* Role Info */}
                <div style={{
                  borderBottom: '1px solid #e0e0e0',
                  paddingBottom: '1rem',
                  marginBottom: '1rem',
                  textAlign: 'center'
                }}>
                  <p style={{ 
                    fontSize: '1.1rem', 
                    margin: '0.5rem 0',
                    fontWeight: 'normal'
                  }}>
                    Role: {user?.role || 'Submitter'}
                  </p>
                </div>

                {/* Bio */}
                <div style={{
                  textAlign: 'center',
                  marginBottom: '2.5rem'
                }}>
                  <p style={{ 
                    fontSize: '1rem', 
                    lineHeight: '1.5',
                    margin: '1rem 0',
                    color: '#333'
                  }}>
                    {user?.bio || 'No bio provided.'}
                  </p>
                </div>

                {/* Private Information */}
                <div style={{
                  marginBottom: '1rem'
                }}>
                  <h2 style={{ 
                    textAlign: 'center',
                    fontSize: '1.5rem',
                    fontWeight: 'normal',
                    marginBottom: '1.5rem'
                  }}>
                    Private Information
                  </h2>
                  
                  <div style={{
                    borderBottom: '1px solid #e0e0e0',
                    paddingBottom: '0.5rem',
                    marginBottom: '0.5rem',
                    textAlign: 'center'
                  }}>
                    <p style={{ 
                      fontSize: '1rem', 
                      margin: '0.5rem 0',
                      color: '#333'
                    }}>
                      Email: {user?.email || '******'}
                    </p>
                  </div>
                  
                  <div style={{
                    borderBottom: '1px solid #e0e0e0',
                    paddingBottom: '0.5rem',
                    marginBottom: '0.5rem',
                    textAlign: 'center'
                  }}>
                    <p style={{ 
                      fontSize: '1rem', 
                      margin: '0.5rem 0',
                      color: '#333'
                    }}>
                      Password: ********
                    </p>
                  </div>
                  
                  <div style={{
                    textAlign: 'center'
                  }}>
                    <p style={{ 
                      fontSize: '1rem', 
                      margin: '0.5rem 0',
                      color: '#333'
                    }}>
                      Mobile Phone: {user?.phone || '******'}
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
} 