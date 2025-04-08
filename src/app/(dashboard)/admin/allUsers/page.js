'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function AllUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('All');
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

  // Fetch users when user is authenticated
  useEffect(() => {
    // Only fetch if user is authenticated and is an admin
    if (!authLoading && user && user.role?.toLowerCase() === 'admin') {
      const fetchUsers = async () => {
        try {
          const response = await fetch('/API/users');
          
          if (!response.ok) {
            throw new Error('Failed to fetch users');
          }
          
          const data = await response.json();
          setUsers(data.users || []);
        } catch (error) {
          console.error('Error fetching users:', error);
        } finally {
          setLoading(false);
        }
      };
      
      fetchUsers();
    }
  }, [user, authLoading]);

  const handleDelete = async (userId) => {
    if (!confirm('Are you sure you want to delete this user?')) {
      return;
    }
    
    try {
      const response = await fetch(`/API/users/${userId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete user');
      }
      
      // Remove the deleted user from the state
      setUsers(users.filter(user => user.id !== userId));
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Failed to delete user. Please try again.');
    }
  };

  // Filter users based on active tab
  const filteredUsers = users.filter(user => {
    if (activeTab === 'All') {
      return true; // Show all users
    } else if (activeTab === 'Submitter') {
      return user.role.toLowerCase() === 'submitter'; // Show only submitters
    } else if (activeTab === 'Performer') {
      return user.role.toLowerCase() === 'performer'; // Show only performers
    }
    return true;
  });

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
          <div>
            <h2 style={{ margin: 0, fontSize: '1.2rem' }}>System Users</h2>
            <p style={{ margin: 0, color: '#666', fontSize: '0.9rem' }}>
              {users.length} Users
            </p>
          </div>
        </div>

        {/* Create New User button */}
        <div style={{ marginBottom: '1.5rem' }}>
          <button 
            onClick={() => router.push('/admin/newUser')}
            style={{ 
              backgroundColor: '#e74c3c',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              padding: '0.75rem 1.5rem',
              fontSize: '0.9rem',
              fontWeight: 'bold',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" fill="white"/>
            </svg>
            Create New User
          </button>
        </div>

        {/* Tab navigation */}
        <div style={{ 
          display: 'flex', 
          marginBottom: '1.5rem',
          gap: '1rem',
          maxWidth: '400px'
        }}>
          {['All', 'Submitter', 'Performer'].map(tab => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{ 
                flex: 1,
                padding: '0.5rem 0',
                backgroundColor: activeTab === tab ? '#e74c3c' : '#6c92e6',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: '500',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                transition: 'all 0.2s ease'
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* No users state */}
        {filteredUsers.length === 0 && (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
            No users found.
          </div>
        )}

        {/* User items */}
        {filteredUsers.map(user => (
          <div 
            key={user.id}
            style={{ 
              border: '1px solid #e0e0e0',
              borderRadius: '8px',
              padding: '1rem',
              marginBottom: '1rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ 
                width: '40px', 
                height: '40px', 
                backgroundColor: '#7095e6', 
                borderRadius: '50%',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                marginRight: '1rem',
                overflow: 'hidden'
              }}>
                {user.image ? (
                  <img 
                    src={user.image} 
                    alt={user.name} 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                  />
                ) : (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" fill="white"/>
                  </svg>
                )}
              </div>
              <div>
                <p style={{ margin: 0, fontSize: '1rem', fontWeight: '500' }}>
                  {user.name}
                </p>
                <p style={{ margin: 0, fontSize: '0.9rem', color: '#ff0000' }}>
                  #{user.id.substring(0, 6)}
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <span style={{ 
                fontSize: '0.9rem', 
                color: '#666', 
                backgroundColor: '#f5f5f5', 
                padding: '0.25rem 0.75rem', 
                borderRadius: '4px'
              }}>
                {user.role}
              </span>
              <button 
                onClick={() => router.push(`/admin/editUser/${user.id}`)}
                style={{ 
                  padding: '0.5rem 1rem',
                  backgroundColor: 'transparent',
                  color: '#000',
                  border: 'none',
                  fontWeight: 'bold',
                  fontSize: '0.9rem',
                  cursor: 'pointer'
                }}
              >
                EDIT
              </button>
              <button 
                onClick={() => handleDelete(user.id)}
                style={{ 
                  padding: '0.5rem 1rem',
                  backgroundColor: 'transparent',
                  color: '#000',
                  border: 'none',
                  fontWeight: 'bold',
                  fontSize: '0.9rem',
                  cursor: 'pointer'
                }}
              >
                DELETE
              </button>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
} 