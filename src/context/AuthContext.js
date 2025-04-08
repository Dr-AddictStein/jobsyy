'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Load user data from cookies on initial render
  useEffect(() => {
    const loadUserFromCookie = () => {
      const storedUser = Cookies.get('user');
      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          setUser(userData);
          return userData;
        } catch (error) {
          console.error('Error parsing user data from cookie:', error);
          Cookies.remove('user');
        }
      }
      return null;
    };

    loadUserFromCookie();
    setLoading(false);
  }, []);

  // Login function
  const login = async (responseData) => {
    // Store only the user object from the response
    const userData = responseData.user;
    
    if (!userData) {
      console.error('No user data provided in the login response', responseData);
      return;
    }
    
    setUser(userData);
    // Store user data in a cookie that expires in 7 days
    Cookies.set('user', JSON.stringify(userData), { expires: 7, path: '/' });
    
    // Redirect based on user role
    if (userData.role.toLowerCase() === 'submitter') {
      router.push('/submitter');
    } else if (userData.role.toLowerCase() === 'performer') {
      router.push('/performer');
    } else if (userData.role.toLowerCase() === 'admin') {
      router.push('/admin');
    }
  };

  // Update user function
  const updateUser = (userData) => {
    if (!userData) {
      console.error('No user data provided for update');
      return;
    }
    
    setUser(userData);
    // Update user data in the cookie
    Cookies.set('user', JSON.stringify(userData), { expires: 7, path: '/' });
  };

  // Logout function
  const logout = async () => {
    try {
      // Call logout API
      await fetch('/API/logout', {
        method: 'POST',
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear user state and cookie
      setUser(null);
      Cookies.remove('user', { path: '/' });
      router.push('/auth/login');
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext); 