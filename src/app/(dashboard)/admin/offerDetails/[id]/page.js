'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { useAuth } from '@/context/AuthContext';

export default function OfferDetailsPage({ params }) {
  const { id } = params;
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [offer, setOffer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Check authentication status after component mounts
  useEffect(() => {
    // Only redirect if auth loading is complete and user is not available
    if (!authLoading && !user) {
      router.push('/auth/login');
      return;
    }
    
    // Only redirect if auth loading is complete and user has a role other than submitter
    if (!authLoading && user && user.role?.toLowerCase() !== 'admin') {
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
  }, [user, authLoading, router]);

  // Fetch offer details when user is authenticated
  useEffect(() => {
    if (!authLoading && user && user.role?.toLowerCase() === 'admin') {
      const fetchOfferDetails = async () => {
        try {
          const response = await fetch(`/API/offers/${id}`);
          if (!response.ok) {
            throw new Error('Failed to fetch offer details');
          }
          
          const data = await response.json();
          setOffer(data.offer);
        } catch (error) {
          console.error('Error fetching offer details:', error);
          setError(error.message || 'Failed to fetch offer details');
        } finally {
          setLoading(false);
        }
      };
      
      fetchOfferDetails();
    }
  }, [id, user, authLoading]);

  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), 'dd.MM.yyyy');
    } catch (error) {
      return 'Invalid date';
    }
  };

  const handleAccept = async (performerId) => {
    try {
      const response = await fetch(`/API/offers/${id}/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ performerId }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to accept performer');
      }
      
      // Refresh data
      const updatedResponse = await fetch(`/API/offers/${id}`);
      const data = await updatedResponse.json();
      setOffer(data.offer);
    } catch (error) {
      console.error('Error accepting performer:', error);
      alert('Failed to accept performer. Please try again.');
    }
  };

  const handleReject = async (performerId) => {
    try {
      const response = await fetch(`/API/offers/${id}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ performerId }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to reject performer');
      }
      
      // Refresh data
      const updatedResponse = await fetch(`/API/offers/${id}`);
      const data = await updatedResponse.json();
      setOffer(data.offer);
    } catch (error) {
      console.error('Error rejecting performer:', error);
      alert('Failed to reject performer. Please try again.');
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this offer?')) {
      return;
    }
    
    try {
      const response = await fetch(`/API/offers/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete offer');
      }
      
      router.push('/admin/allOffers');
    } catch (error) {
      console.error('Error deleting offer:', error);
      alert('Failed to delete offer. Please try again.');
    }
  };

  const handleSubmitterComplete = async (performerId) => {
    try {
      // Find the performer application
      const performerApplication = offer.performers.find(p => p.performerId === performerId && p.isAccepted);
      
      if (!performerApplication) {
        throw new Error('Accepted performer application not found');
      }
      
      const response = await fetch(`/API/offerPerformers/${performerApplication.id}/complete`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          submitterCompletedTask: true
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to mark task as complete');
      }
      
      // Refresh data
      const updatedResponse = await fetch(`/API/offers/${id}`);
      const data = await updatedResponse.json();
      setOffer(data.offer);
    } catch (error) {
      console.error('Error completing task:', error);
      alert('Failed to mark task as complete. Please try again.');
    }
  };

  // Show loading state
  if (authLoading || loading) {
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

  // Show error state
  if (error || !offer) {
    return (
      <main style={{ 
        padding: '2rem', 
        fontFamily: 'sans-serif',
        backgroundColor: '#f9f3f3',
        minHeight: '100vh'
      }}>
        <div style={{ 
          backgroundColor: '#ffe6e6', 
          border: '1px solid #ff8080', 
          color: '#cc0000',
          padding: '1rem',
          borderRadius: '4px',
          marginBottom: '1rem'
        }}>
          {error || 'Offer not found'}
        </div>
        <button 
          onClick={() => router.push('/admin/allOffers')}
          style={{ 
            padding: '0.5rem 1rem',
            backgroundColor: '#6c92e6',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Back to All Offers
        </button>
      </main>
    );
  }

  // Determine if offer is active based on created date (just like in allOffers page)
  const isRunning = offer.status === 'RUNNING' || (new Date(offer.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
  const status = offer.status || (isRunning ? 'Running' : 'Done');
  
  // Get status color based on status
  const getStatusColor = (status) => {
    switch(status) {
      case 'NEW': return { bg: '#f5f5f5', text: '#666' };
      case 'APPLICATION': return { bg: '#e6f7ff', text: '#1890ff' };
      case 'RUNNING': return { bg: '#e6f7f0', text: '#0a8050' };
      case 'DONE': return { bg: '#f0f2f5', text: '#52c41a' };
      default: return { bg: '#e6f7f0', text: '#0a8050' }; // Default to running style
    }
  };
  
  const statusColors = getStatusColor(status);
  
  // Find the accepted performer, if any
  const acceptedPerformer = offer.performers?.find(p => p.isAccepted);
  const hasAcceptedPerformer = !!acceptedPerformer;
  const submitterCompletedTask = acceptedPerformer?.submitterCompletedTask || false;

  return (
    <main style={{ 
      padding: '2rem', 
      fontFamily: 'sans-serif',
      backgroundColor: '#f9f3f3',
      minHeight: '100vh' 
    }}>
      <div style={{ 
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
        padding: '2rem',
        marginBottom: '2rem'
      }}>
        {/* Header section with title and actions */}
        <div style={{ 
          borderBottom: '1px solid #e0e0e0',
          paddingBottom: '1.5rem',
          marginBottom: '1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start'
        }}>
          <div>
            <h1 style={{ margin: '0 0 0.5rem 0', fontSize: '1.5rem' }}>{offer.title}</h1>
            <div style={{ color: '#666', fontSize: '0.9rem' }}>
              Offer ID <span style={{ color: '#ff0000' }}>#{offer.id.substring(0, 6)}</span>
            </div>
            <div style={{ color: '#666', fontSize: '0.9rem', marginTop: '0.25rem' }}>
              Posted by, <span style={{ color: '#4a90e2' }}>{offer.submitter?.name || user?.name || 'Unknown'}</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <div style={{ 
              backgroundColor: statusColors.bg,
              color: statusColors.text,
              padding: '0.5rem 1rem',
              borderRadius: '4px',
              fontSize: '0.9rem',
              fontWeight: 'bold',
              marginBottom: '0.5rem'
            }}>
              {status}
            </div>
            <div style={{ fontSize: '0.9rem', color: '#666' }}>
              {formatDate(offer.createdAt)}
            </div>
            <div style={{ 
              display: 'flex', 
              gap: '0.5rem', 
              marginTop: '1rem'
            }}>
              <button 
                onClick={() => router.push(`/admin/editOffer/${offer.id}`)}
                style={{
                  backgroundColor: 'transparent',
                  color: '#333',
                  border: 'none',
                  padding: '0.5rem 1rem',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  fontSize: '0.9rem'
                }}
              >
                EDIT
              </button>
              <button
                onClick={handleDelete}
                style={{
                  backgroundColor: 'transparent',
                  color: '#333',
                  border: 'none',
                  padding: '0.5rem 1rem',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  fontSize: '0.9rem'
                }}
              >
                DELETE
              </button>
            </div>
          </div>
        </div>

        {/* Offer content */}
        <div style={{ marginBottom: '2rem' }}>
          <div 
            style={{ 
              backgroundColor: '#f9f9f9', 
              padding: '1.5rem', 
              borderRadius: '8px',
              lineHeight: '1.6',
              color: '#333'
            }}
            dangerouslySetInnerHTML={{ __html: offer.description }}
          />
        </div>
      </div>

      {/* Completion section - only show when there is an accepted performer */}
      {hasAcceptedPerformer && status === 'RUNNING' && (
        <div style={{ 
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
          padding: '2rem',
          marginBottom: '2rem'
        }}>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '1.5rem' }}>Conclusion</h2>
          <p>Both the Submitter and Performer can indicate when the project is completed.</p>
          
          <div style={{ 
            borderRadius: '4px',
            border: '1px solid #e0e0e0',
            padding: '1rem',
            marginBottom: '1rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <div style={{ fontWeight: 'bold' }}>Submitter</div>
              <div style={{ marginTop: '0.5rem' }}>
                Project status - <span>{status}</span>
              </div>
            </div>
            
            {!submitterCompletedTask && (
              <button
                onClick={() => handleSubmitterComplete(acceptedPerformer.performerId)}
                style={{
                  backgroundColor: '#0a8050',
                  color: 'white',
                  border: 'none',
                  padding: '0.5rem 1.5rem',
                  borderRadius: '4px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  fontSize: '0.9rem'
                }}
              >
                Mark as Done
              </button>
            )}
          </div>
          
          <div style={{ 
            borderRadius: '4px',
            border: '1px solid #e0e0e0',
            padding: '1rem'
          }}>
            <div style={{ fontWeight: 'bold' }}>Performer</div>
            <div style={{ 
              marginTop: '0.5rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>Project status - <span>{status}</span></div>
              {acceptedPerformer?.performerCompletedTask && (
                <div style={{
                  backgroundColor: '#f6ffed',
                  color: '#52c41a',
                  padding: '0.25rem 0.75rem',
                  borderRadius: '4px',
                  fontSize: '0.8rem',
                  fontWeight: 'bold'
                }}>
                  Marked as Done
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Performers/Applications section - only show if offer is not running */}
      {(!hasAcceptedPerformer || status === 'NEW') && (
        <div style={{ 
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
          padding: '2rem'
        }}>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '1.5rem' }}>
            Applications - you can accept only one Performer
          </h2>

          {offer.performers && offer.performers.length > 0 ? (
            offer.performers.map((item) => (
              <div 
                key={item.id}
                style={{ 
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '1rem 0',
                  borderBottom: '1px solid #e0e0e0'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <div style={{ 
                    width: '45px',
                    height: '45px',
                    borderRadius: '50%',
                    backgroundColor: '#6c92e6',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    color: 'white',
                    fontWeight: 'bold',
                    fontSize: '1.2rem',
                    marginRight: '1rem'
                  }}>
                    {item.performer?.name?.charAt(0) || 'U'}
                  </div>
                  <div>
                    <div style={{ fontWeight: 'bold' }}>
                      {item.performer?.name || 'Unknown User'}
                    </div>
                    <div style={{ color: '#ff0000', fontSize: '0.9rem' }}>
                      #{item.performerId?.substring(0, 6) || '000000'}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={() => handleAccept(item.performerId)}
                    style={{
                      backgroundColor: '#0a8050',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      padding: '0.5rem 1.5rem',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      fontSize: '0.9rem'
                    }}
                  >
                    ACCEPT
                  </button>
                  <button
                    onClick={() => handleReject(item.performerId)}
                    style={{
                      backgroundColor: '#e74c3c',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      padding: '0.5rem 1.5rem',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      fontSize: '0.9rem'
                    }}
                  >
                    REJECT
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div style={{ 
              textAlign: 'center', 
              padding: '2rem', 
              backgroundColor: '#f9f9f9',
              borderRadius: '8px',
              color: '#666'
            }}>
              No applications yet
            </div>
          )}
        </div>
      )}
    </main>
  );
} 