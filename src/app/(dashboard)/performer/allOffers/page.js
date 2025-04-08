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

  // Fetch offers when user is authenticated
  useEffect(() => {
    // Only fetch if user is authenticated and is a performer
    if (!authLoading && user && user.role?.toLowerCase() === 'performer') {
      const fetchOffers = async () => {
        try {
          // For performers, fetch ALL offers from the database with a special query parameter
          const response = await fetch('/API/offers?role=all');
          
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

  const handleApply = async (offerId) => {
    try {
      const response = await fetch(`/API/offers/${offerId}/apply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ performerId: user.id }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to apply for offer');
      }
      
      alert('Successfully applied for this offer!');
      // Refresh offers to update status
      const updatedResponse = await fetch('/API/offers?role=all');
      const data = await updatedResponse.json();
      setOffers(data.offers || []);
    } catch (error) {
      console.error('Error applying for offer:', error);
      alert('Failed to apply for this offer. Please try again.');
    }
  };

  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), 'dd.MM.yyyy');
    } catch (error) {
      return 'Invalid date';
    }
  };

  // Filter logic will be implemented later
  const filteredOffers = offers;

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
              <path d="M20 6h-4V4c0-1.11-.89-2-2-2h-4c-1.11 0-2 .89-2 2v2H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-6 0h-4V4h4v2z" fill="white"/>
            </svg>
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.2rem' }}>Available Offers</h2>
            <p style={{ margin: 0, color: '#666', fontSize: '0.9rem' }}>
              {offers.length} {offers.length === 1 ? 'Offer' : 'Offers'} available
            </p>
          </div>
        </div>

        {/* Tab navigation */}
        <div style={{ 
          display: 'flex', 
          marginBottom: '1.5rem',
          gap: '1rem',
          maxWidth: '600px'
        }}>
          {['All', 'My Active Offers', 'My Previous Offers'].map(tab => (
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
            No offers available at the moment. Please check back later.
          </div>
        )}

        {/* Offer items */}
        {filteredOffers.map(offer => {
          // Check if performer has already applied (this would need to be part of your offer data)
          const hasApplied = offer.applications?.some(app => app.performerId === user.id) || false;
          
          return (
            <div 
              key={offer.id}
              style={{ 
                border: '1px solid #e0e0e0',
                borderRadius: '8px',
                padding: '1rem',
                marginBottom: '1rem',
                position: 'relative'
              }}
            >
              <div style={{ marginBottom: '0.5rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 'bold' }}>
                  {offer.title}
                </h3>
                
              </div>
              <div style={{ 
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: '1rem',
                flexWrap: 'wrap',
                gap: '0.5rem'
              }}>
                <div>
                  <p style={{ margin: 0, fontSize: '0.9rem', color: '#666' }}>
                    Offer ID <span style={{ color: '#ff0000' }}>#{offer.id?.substring(0, 6)}</span>
                  </p>
                  <p style={{ margin: 0, fontSize: '0.9rem', color: '#666' }}>
                    Posted: <span style={{ fontWeight: 'medium' }}>{formatDate(offer.createdAt)}</span>
                  </p>
                  {offer.budget && (
                    <p style={{ margin: 0, fontSize: '0.9rem', color: '#666' }}>
                      Budget: <span style={{ fontWeight: 'bold', color: '#e74c3c' }}>${offer.budget}</span>
                    </p>
                  )}
                </div>
                <div>
                  <button 
                    onClick={() => router.push(`/performer/offerDetails/${offer.id}`)}
                    style={{ 
                      padding: '0.5rem 1rem',
                      backgroundColor: '#7095e6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      marginRight: '0.5rem',
                      cursor: 'pointer'
                    }}
                  >
                    View Details
                  </button>
                  {/* <button 
                    onClick={() => handleApply(offer.id)}
                    disabled={hasApplied}
                    style={{ 
                      padding: '0.5rem 1rem',
                      backgroundColor: hasApplied ? '#aaa' : '#e74c3c',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: hasApplied ? 'default' : 'pointer'
                    }}
                  >
                    {hasApplied ? 'Applied' : 'Apply Now'}
                  </button> */}
                </div>
              </div>

              {/* Skills/Tags if available */}
              {offer.skills && offer.skills.length > 0 && (
                <div style={{ marginTop: '1rem' }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {offer.skills.map((skill, index) => (
                      <span 
                        key={index}
                        style={{
                          backgroundColor: '#f0f0f0',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '50px',
                          fontSize: '0.8rem',
                          color: '#555'
                        }}
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </main>
  );
} 