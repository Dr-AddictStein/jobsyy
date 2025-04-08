'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function EditUserPage({ params }) {
  const { id } = params;
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: '',
    bio: '',
    phone: '',
    dateOfBirth: '',
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  // Check authentication status after component mounts
  useEffect(() => {
    // Only redirect if auth loading is complete and user is not available
    if (!authLoading && !user) {
      router.push('/auth/login');
      return;
    }
    
    // Only redirect if auth loading is complete and user has a role other than admin
    if (!authLoading && user && user.role?.toLowerCase() !== 'admin') {
      const role = user.role?.toLowerCase() || '';
      switch (role) {
        case 'submitter':
          router.push('/submitter');
          break;
        case 'performer':
          router.push('/performer');
          break;
        default:
          router.push('/');
      }
    }
  }, [user, authLoading, router]);

  // Fetch user data when component mounts
  useEffect(() => {
    if (!authLoading && user && user.role?.toLowerCase() === 'admin') {
      const fetchUser = async () => {
        try {
          const response = await fetch(`/API/users/${id}`);
          
          if (!response.ok) {
            throw new Error('Failed to fetch user data');
          }
          
          const data = await response.json();
          setFormData({
            name: data.user.name || '',
            email: data.user.email || '',
            password: '', // Password is never returned from API
            role: data.user.role || '',
            bio: data.user.bio || '',
            phone: data.user.phone || '',
            dateOfBirth: data.user.dateOfBirth || '',
          });
        } catch (error) {
          console.error('Error fetching user data:', error);
          setError('Failed to load user data. Please try again.');
        } finally {
          setLoading(false);
        }
      };
      
      fetchUser();
    }
  }, [id, user, authLoading]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    
    // Remove password if it's empty
    const submitData = { ...formData };
    if (!submitData.password) {
      delete submitData.password;
    }
    
    try {
      const response = await fetch(`/API/users/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update user');
      }
      
      router.push('/admin/allUsers');
    } catch (error) {
      console.error('Error updating user:', error);
      setError(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Show loading state while authentication or data is loading
  if (authLoading || (!authLoading && !user) || loading) {
    return (
      <main style={{ 
        padding: '2rem', 
        fontFamily: 'sans-serif', 
        backgroundColor: '#f9f3f3',
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <div>Loading...</div>
      </main>
    );
  }

  return (
    <main style={{ 
      padding: '2rem', 
      fontFamily: 'sans-serif', 
      backgroundColor: '#f9f3f3', 
      minHeight: '100vh' 
    }}>
      <div style={{ 
        width: '100%', 
        maxWidth: '600px',
        margin: '0 auto', 
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
        padding: '2rem'
      }}>
        {/* Header with icon and title */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          marginBottom: '1.5rem' 
        }}>
          <div style={{ 
            width: '40px', 
            height: '40px', 
            backgroundColor: '#7095e6', 
            borderRadius: '4px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: '1rem'
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 5.9c1.16 0 2.1.94 2.1 2.1s-.94 2.1-2.1 2.1S9.9 9.16 9.9 8s.94-2.1 2.1-2.1m0 9c2.97 0 6.1 1.46 6.1 2.1v1.1H5.9V17c0-.64 3.13-2.1 6.1-2.1M12 4C9.79 4 8 5.79 8 8s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm0 9c-2.67 0-8 1.34-8 4v3h16v-3c0-2.66-5.33-4-8-4z" fill="white"/>
            </svg>
          </div>
          <h2 style={{ margin: 0, fontSize: '1.2rem' }}>Edit User</h2>
        </div>

        {error && (
          <div style={{ 
            backgroundColor: '#ffebee', 
            color: '#c62828', 
            padding: '0.75rem', 
            borderRadius: '4px', 
            marginBottom: '1.5rem',
            fontSize: '0.9rem'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1.5rem' }}>
            <label 
              htmlFor="name" 
              style={{ 
                display: 'block', 
                marginBottom: '0.5rem', 
                fontSize: '0.9rem', 
                fontWeight: '500' 
              }}
            >
              Name
            </label>
            <input 
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              style={{ 
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #e0e0e0',
                borderRadius: '4px',
                fontSize: '0.9rem'
              }}
              placeholder="Enter user's name"
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label 
              htmlFor="email" 
              style={{ 
                display: 'block', 
                marginBottom: '0.5rem', 
                fontSize: '0.9rem', 
                fontWeight: '500' 
              }}
            >
              Email
            </label>
            <input 
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              style={{ 
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #e0e0e0',
                borderRadius: '4px',
                fontSize: '0.9rem'
              }}
              placeholder="Enter user's email"
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label 
              htmlFor="password" 
              style={{ 
                display: 'block', 
                marginBottom: '0.5rem', 
                fontSize: '0.9rem', 
                fontWeight: '500' 
              }}
            >
              Password (Leave blank to keep current password)
            </label>
            <input 
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              style={{ 
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #e0e0e0',
                borderRadius: '4px',
                fontSize: '0.9rem'
              }}
              placeholder="Enter new password"
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label 
              htmlFor="role" 
              style={{ 
                display: 'block', 
                marginBottom: '0.5rem', 
                fontSize: '0.9rem', 
                fontWeight: '500' 
              }}
            >
              Role
            </label>
            <select 
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              required
              style={{ 
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #e0e0e0',
                borderRadius: '4px',
                fontSize: '0.9rem',
                backgroundColor: 'white'
              }}
            >
              <option value="">Select a role</option>
              <option value="Submitter">Submitter</option>
              <option value="Performer">Performer</option>
              <option value="Admin">Admin</option>
            </select>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label 
              htmlFor="bio" 
              style={{ 
                display: 'block', 
                marginBottom: '0.5rem', 
                fontSize: '0.9rem', 
                fontWeight: '500' 
              }}
            >
              Bio (Optional)
            </label>
            <textarea 
              id="bio"
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              style={{ 
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #e0e0e0',
                borderRadius: '4px',
                fontSize: '0.9rem',
                minHeight: '100px',
                resize: 'vertical'
              }}
              placeholder="Enter user's bio"
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label 
              htmlFor="phone" 
              style={{ 
                display: 'block', 
                marginBottom: '0.5rem', 
                fontSize: '0.9rem', 
                fontWeight: '500' 
              }}
            >
              Phone (Optional)
            </label>
            <input 
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              style={{ 
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #e0e0e0',
                borderRadius: '4px',
                fontSize: '0.9rem'
              }}
              placeholder="Enter user's phone number"
            />
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <label 
              htmlFor="dateOfBirth" 
              style={{ 
                display: 'block', 
                marginBottom: '0.5rem', 
                fontSize: '0.9rem', 
                fontWeight: '500' 
              }}
            >
              Date of Birth (Optional)
            </label>
            <input 
              type="date"
              id="dateOfBirth"
              name="dateOfBirth"
              value={formData.dateOfBirth}
              onChange={handleChange}
              style={{ 
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #e0e0e0',
                borderRadius: '4px',
                fontSize: '0.9rem'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <button 
              type="button"
              onClick={() => router.push('/admin/allUsers')}
              style={{ 
                flex: 1,
                padding: '0.75rem',
                backgroundColor: '#f0f2f5',
                color: '#333',
                border: 'none',
                borderRadius: '4px',
                fontSize: '0.9rem',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={submitting}
              style={{ 
                flex: 1,
                padding: '0.75rem',
                backgroundColor: '#e74c3c',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '0.9rem',
                fontWeight: '500',
                cursor: submitting ? 'not-allowed' : 'pointer',
                opacity: submitting ? 0.7 : 1
              }}
            >
              {submitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
} 