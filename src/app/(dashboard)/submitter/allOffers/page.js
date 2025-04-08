'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { useAuth } from '@/context/AuthContext';

export default function AllOffersPage() {
  const [offers, setOffers] = useState([]);
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
    
    // Only redirect if auth loading is complete and user has a role other than submitter
    if (!authLoading && user && user.role?.toLowerCase() !== 'submitter') {
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

  // Fetch offers when user is authenticated
  useEffect(() => {
    // Only fetch if user is authenticated and is a submitter
    if (!authLoading && user && user.role?.toLowerCase() === 'submitter') {
      const fetchOffers = async () => {
        try {
          const response = await fetch('/API/offers?role=submitter');
          
          if (!response.ok) {
            throw new Error('Failed to fetch offers');
          }
          
          const data = await response.json();
          setOffers(data.offers || []);
        } catch (error) {
          console.error('Error fetching offers:', error);
        } finally {
          setLoading(false);
        }
      };
      
      fetchOffers();
    }
  }, [user, authLoading]);

  const handleDelete = async (offerId) => {
    if (!confirm('Are you sure you want to delete this offer?')) {
      return;
    }
    
    try {
      const response = await fetch(`/API/offers/${offerId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete offer');
      }
      
      // Remove the deleted offer from the state
      setOffers(offers.filter(offer => offer.id !== offerId));
    } catch (error) {
      console.error('Error deleting offer:', error);
      alert('Failed to delete offer. Please try again.');
    }
  };

  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), 'dd.MM.yyyy');
    } catch (error) {
      return 'Invalid date';
    }
  };

  const filteredOffers = activeTab === 'All' 
    ? offers
    : offers.filter(offer => {
        // This is a placeholder - in a real app, you'd have a status field
        // For now, we'll just simulate by considering newer offers as "Running" and older as "Done"
        const isRunning = new Date(offer.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        return activeTab === 'Running' ? isRunning : !isRunning;
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
            <h2 style={{ margin: 0, fontSize: '1.2rem' }}>My Offers</h2>
            <p style={{ margin: 0, color: '#666', fontSize: '0.9rem' }}>
              {offers.length} {offers.length === 1 ? 'Offer' : 'Offers'}
            </p>
          </div>
        </div>

        {/* Create New Offer button */}
        <div style={{ marginBottom: '1.5rem' }}>
          <button 
            onClick={() => router.push('/submitter/newOffer')}
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
            Create New Offer
          </button>
        </div>

        {/* Tab navigation */}
        <div style={{ 
          display: 'flex', 
          marginBottom: '1.5rem',
          gap: '1rem',
          maxWidth: '400px'
        }}>
          {['All', 'Running', 'Done'].map(tab => (
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

        {/* No offers state */}
        {filteredOffers.length === 0 && (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
            No offers found. Create a new offer to get started.
          </div>
        )}

        {/* Offer items */}
        {filteredOffers.map(offer => {
          // For demo purposes, consider offers created within the last week as "Running"
          const status = new Date(offer.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) 
            ? 'Running' 
            : 'Done';
          
          return (
            <div 
              key={offer.id}
              style={{ 
                border: '1px solid #e0e0e0',
                borderRadius: '8px',
                padding: '1rem',
                marginBottom: '1rem',
                cursor: 'pointer'
              }}
              onClick={() => router.push(`/submitter/offerDetails/${offer.id}`)}
            >
              <div style={{ marginBottom: '0.5rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 'normal' }}>
                  {offer.title}
                </h3>
              </div>
              <div style={{ 
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <p style={{ margin: 0, fontSize: '0.9rem', color: '#666' }}>
                    Offer ID <span style={{ color: '#ff0000' }}>#{offer.id.substring(0, 6)}</span>
                  </p>
                  <p style={{ margin: 0, fontSize: '0.9rem', color: '#666' }}>
                    Posted by, <span style={{ color: '#4a90e2' }}>{offer.submitter?.name || user?.name || 'Unknown'}</span>
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <span style={{ fontSize: '0.9rem', color: '#666' }}>{status}</span>
                  <span style={{ fontSize: '0.9rem', color: '#666' }}>{formatDate(offer.createdAt)}</span>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent navigation when clicking delete
                      handleDelete(offer.id);
                    }}
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
            </div>
          );
        })}
      </div>
    </main>
  );
} 