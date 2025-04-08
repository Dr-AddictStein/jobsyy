'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import RichTextEditor from '@/components/Dashboard/RichTextEditor';
import { useAuth } from '@/context/AuthContext';

export default function NewOfferPage() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const { user, loading } = useAuth();
  const router = useRouter();

  // Check authentication status after component mounts
  useEffect(() => {
    // Only redirect if loading is complete and user is not available
    if (!loading && !user) {
      router.push('/auth/login');
      return;
    }
    
    // Only redirect if loading is complete and user has a role other than submitter
    if (!loading && user && user.role?.toLowerCase() !== 'submitter') {
      const role = user.role?.toLowerCase() || '';
      switch (role) {
        case 'admin':
          router.push('/admin');
          break;
        case 'performer':
          router.push('/performer');
          break;
        default:
          router.push('/');
      }
    }
  }, [user, loading, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!title || !content) {
      setErrorMessage('Please fill in all fields');
      return;
    }
    
    setIsSubmitting(true);
    setErrorMessage('');
    
    try {
      const response = await fetch('/API/offers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          description: content,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to create offer');
      }
      
      // Redirect to all offers page after successful creation
      router.push('/submitter/allOffers');
    } catch (error) {
      console.error('Error creating offer:', error);
      setErrorMessage(error.message || 'Failed to create offer. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show loading state
  if (loading || (!loading && !user)) {
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
      minHeight: '100vh',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center'
    }}>
      <div style={{ 
        width: '90%', 
        backgroundColor: '#6c92e6', 
        borderRadius: '8px',
        padding: '2rem',
        boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
      }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Page title */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            marginBottom: '1rem' 
          }}>
            <div style={{ 
              width: '40px', 
              height: '40px', 
              backgroundColor: '#e74c3c', 
              borderRadius: '4px',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              marginRight: '1rem'
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" fill="white"/>
              </svg>
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.2rem', color: 'white' }}>Create New Offer</h2>
              <p style={{ margin: 0, color: '#f9f3f3', fontSize: '0.9rem' }}>
                Fill in the details to create a new offer
              </p>
            </div>
          </div>

          {/* Error message */}
          {errorMessage && (
            <div style={{ 
              backgroundColor: '#ffe6e6', 
              border: '1px solid #ff8080', 
              color: '#cc0000',
              padding: '0.75rem',
              borderRadius: '4px',
              marginBottom: '1rem'
            }}>
              {errorMessage}
            </div>
          )}

          {/* Offer Name field with label */}
          <div style={{ display: 'flex' }}>
            <div style={{ 
              backgroundColor: '#e74c3c', 
              color: 'white',
              padding: '0.75rem 1rem',
              borderTopLeftRadius: '4px',
              borderBottomLeftRadius: '4px',
              display: 'flex',
              alignItems: 'center'
            }}>
              Offer Name
            </div>
            <input 
              type="text" 
              placeholder="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{ 
                flex: 1,
                padding: '0.75rem',
                border: 'none',
                borderTopRightRadius: '4px',
                borderBottomRightRadius: '4px',
                outline: 'none'
              }} 
            />
          </div>
          
          {/* Rich Text Editor for Offer Content */}
          <div>
            <RichTextEditor 
              value={content}
              onChange={setContent}
              placeholder="Offer Content // Up to 700 words"
            />
          </div>
          
          {/* Send button */}
          <button 
            type="submit" 
            disabled={isSubmitting}
            style={{ 
              width: '160px',
              padding: '0.75rem', 
              backgroundColor: '#e74c3c', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px', 
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              fontWeight: 'bold',
              fontSize: '1rem',
              opacity: isSubmitting ? 0.7 : 1
            }}
          >
            {isSubmitting ? 'SENDING...' : 'SEND'}
          </button>
        </form>
      </div>
    </main>
  );
} 