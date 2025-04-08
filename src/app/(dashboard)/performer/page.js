'use client';

import Image from "next/image";
import { useUser } from '@/hooks/useUser';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function PerformerDashboardPage() {
  const { user, name, loading } = useUser();
  const [currentDateTime, setCurrentDateTime] = useState('');
  const [loginLogs, setLoginLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  
  useEffect(() => {
    // Format current date for display
    const now = new Date();
    const options = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric', 
      weekday: 'long' 
    };
    setCurrentDateTime(now.toLocaleDateString('en-US', options));
    
    // Check if the user data is loaded and the role is performer
    if (!loading) {
      if (user?.id) {
        fetchLoginLogs(user.id);
        setIsLoading(false);
      } else if (!user) {
        // Redirect if no user data (not logged in)
        router.push('/auth/login');
      }
    }
  }, [user, loading, router]);

  const fetchLoginLogs = async (userId) => {
    try {
      const response = await fetch(`/API/login-logs?userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        setLoginLogs(data);
      } else {
        console.error('Failed to fetch login logs');
      }
    } catch (error) {
      console.error('Error fetching login logs:', error);
    }
  };

  // Function to format login time
  const formatLoginTime = (date) => {
    const d = new Date(date);
    const hours = d.getHours().toString().padStart(2, '0');
    const minutes = d.getMinutes().toString().padStart(2, '0');
    const seconds = d.getSeconds().toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    
    return `[${hours}:${minutes}:${seconds} , ${day}.${month}.${year}]`;
  };

  // Show loading indicator while checking user status
  if (loading || isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh', 
        fontFamily: 'system-ui, -apple-system, sans-serif' 
      }}>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <main style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={{ padding: '1rem' }}>
        <h2 style={{ margin: '0', fontWeight: '600' }}>Hello {name || 'User'},</h2>
        <p style={{ margin: '0.5rem 0 2rem' }}>Today is {currentDateTime}. A perfect time to be a part of JobAdys.</p>
        
        <div style={{ 
          border: '1px solid #ccc', 
          borderRadius: '0.5rem', 
          padding: '1rem', 
          margin: '1rem 0 2rem', 
          boxShadow: '0 0 5px rgba(0,0,0,0.1)' 
        }}>
          <h3 style={{ margin: '0 0 0.5rem', fontWeight: '600' }}>System notification</h3>
          {loginLogs.length > 0 ? (
            loginLogs.map((log, index) => (
              <p key={log.id || index} style={{ margin: '0.5rem 0', fontSize: '0.95rem' }}>
                - Sign in {formatLoginTime(log.createdAt)}
              </p>
            ))
          ) : (
            <p style={{ margin: '0.5rem 0', fontSize: '0.95rem' }}>No recent login activities</p>
          )}
        </div>
      </div>
      
      <div style={{
        backgroundColor: '#5E6FBD',
        color: 'white',
        padding: '3rem 1rem',
        textAlign: 'center',
        marginTop: '1rem',
        paddingBottom: '4rem',
        width: '100%',
        borderRadius: '0.5rem'
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
          <Image src="/Group 18.png" alt="JobAdys Logo" width={40} height={60} />
        </div>
        <h2 style={{ fontWeight: '500', margin: '0.5rem 0' }}>Over <span style={{ fontSize: '2.2rem', fontWeight: '600' }}>100,000</span> Jobseekers Have Used</h2>
        <h2 style={{ fontWeight: '500', margin: '0.5rem 0' }}>JobAdys to Find the Best Way to Work</h2>
      </div>
    </main>
  );
}
