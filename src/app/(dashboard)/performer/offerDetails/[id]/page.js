'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { useAuth } from '@/context/AuthContext';
import { use } from 'react';

export default function OfferDetailsPage({ params }) {
  const resolvedParams = use(params);
  const { id } = resolvedParams;
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [offer, setOffer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);
  
  // Check authentication status after component mounts
  useEffect(() => {
    // Only redirect if auth loading is complete and user is not available
    if (!authLoading && !user) {
      router.push('/auth/login');
      return;
    }
    
    // Only redirect if auth loading is complete and user has a role other than performer
    if (!authLoading && user && user.role?.toLowerCase() !== 'performer') {
      const role = user.role?.toLowerCase() || '';
      switch (role) {
        case 'admin':
          router.push('/admin');
          break;
        case 'submitter':
          router.push('/submitter');
          break;
        default:
          router.push('/');
      }
    }
  }, [user, authLoading, router]);

  // Fetch offer details when user is authenticated
  useEffect(() => {
    if (!authLoading && user && user.role?.toLowerCase() === 'performer') {
      const fetchOfferDetails = async () => {
        try {
          const response = await fetch(`/API/offers/${id}?includeSubmitter=true`);
          if (!response.ok) {
            throw new Error('Failed to fetch offer details');
          }
          
          const data = await response.json();
          console.log('Offer data:', data.offer); // For debugging
          setOffer(data.offer);
          
          // Check if user has already applied to this offer
          if (data.offer.performers && data.offer.performers.some(p => p.performerId === user.id)) {
            setApplied(true);
          }
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

  const handleApply = async () => {
    if (applied) return;
    
    setApplying(true);
    try {
      const response = await fetch('/API/offerPerformers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          offerId: id
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to apply for this offer');
      }
      
      console.log('Application successful:', data);
      setApplied(true);
      
      // Add the current user to performers list to immediately update UI
      if (offer && user) {
        const updatedOffer = {
          ...offer,
          performers: [...(offer.performers || []), {
            performerId: user.id,
            performer: {
              id: user.id,
              name: user.name
            }
          }]
        };
        setOffer(updatedOffer);
      }
    } catch (error) {
      console.error('Error applying for offer:', error);
      setError(error.message || 'Failed to apply for this offer');
      
      // Show error briefly and then clear it
      setTimeout(() => {
        setError(null);
      }, 3000);
    } finally {
      setApplying(false);
    }
  };

  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), 'dd.MM.yyyy');
    } catch (error) {
      return 'Invalid date';
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
          onClick={() => router.push('/performer/allOffers')}
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
  
  // Find the performer application for the current user
  const currentUserApplication = offer.performers?.find(p => p.performerId === user?.id);
  const isAccepted = currentUserApplication?.isAccepted || false;
  const hasCompletedTask = currentUserApplication?.performerCompletedTask || false;

  const handleCompleteTask = async () => {
    try {
      const response = await fetch(`/API/offerPerformers/${currentUserApplication.id}/complete`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          performerCompletedTask: true
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to mark task as complete');
      }
      
      // Update the local state
      const updatedPerformers = offer.performers.map(p => {
        if (p.id === currentUserApplication.id) {
          return { ...p, performerCompletedTask: true };
        }
        return p;
      });
      
      setOffer({ ...offer, performers: updatedPerformers });
    } catch (error) {
      console.error('Error completing task:', error);
      setError(error.message || 'Failed to mark task as complete');
      
      setTimeout(() => {
        setError(null);
      }, 3000);
    }
  };

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
              Posted by <span style={{ color: '#4a90e2' }}>{offer.submitter?.name || 'Unknown'}</span>
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
                onClick={handleApply}
                disabled={applied || applying || !isRunning}
                style={{
                  backgroundColor: applied ? '#e0e0e0' : applying ? '#f0f0f0' : '#4CAF50',
                  color: applied || applying ? '#666' : 'white',
                  border: 'none',
                  padding: '0.5rem 1.5rem',
                  borderRadius: '4px',
                  fontWeight: 'bold',
                  cursor: applied || applying || !isRunning ? 'default' : 'pointer',
                  fontSize: '0.9rem'
                }}
              >
                {applied ? 'Applied' : applying ? 'Applying...' : 'Apply'}
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
        
        {/* Show completion section when the offer is running and the current user is accepted */}
        {status === 'RUNNING' && isAccepted && (
          <div style={{ 
            backgroundColor: 'white',
            borderRadius: '8px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
            padding: '2rem',
            marginTop: '2rem'
          }}>
            <h2 style={{ fontSize: '1.2rem', marginBottom: '1.5rem' }}>Conclusion</h2>
            <p>Both the Submitter and Performer can indicate when the project is completed.</p>
            
            <div style={{ 
              borderRadius: '4px',
              border: '1px solid #e0e0e0',
              padding: '1rem',
              marginTop: '1rem',
              marginBottom: '1rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <div style={{ fontWeight: 'bold' }}>Performer</div>
                <div style={{ 
                  marginTop: '0.5rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>Project status - <span>{status}</span></div>
                  {hasCompletedTask && (
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
              
              {!hasCompletedTask && (
                <button
                  onClick={handleCompleteTask}
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
              <div style={{ fontWeight: 'bold' }}>Submitter</div>
              <div style={{ 
                marginTop: '0.5rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>Project status - <span>{status}</span></div>
                {currentUserApplication?.submitterCompletedTask && (
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
      </div>
      
      <button 
        onClick={() => router.push('/performer/allOffers')}
        style={{ 
          padding: '0.5rem 1rem',
          backgroundColor: '#6c92e6',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          marginTop: '1rem'
        }}
      >
        Back to All Offers
      </button>
    </main>
  );
} 