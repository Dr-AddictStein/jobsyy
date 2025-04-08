'use client';

import Image from 'next/image';
import styles from '@/styles/Dashboard/Admin/Header.module.css';
import { useUser } from '@/hooks/useUser';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

export default function Navbar() {
  const { user } = useUser();
  const { logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      console.log("user", user);
    }
  }, [user]);
  
  const handleNavigation = useCallback((e, href) => {
    e.preventDefault();
    router.push(href);
  }, [router]);
  
  return (
    <div className={styles.navWrapper}>
      <nav className={styles.Header}>
        <div className={styles.left}>
          <Link href="/submitter" onClick={(e) => handleNavigation(e, '/submitter')}>
            <Image src="/Logotipe.png" alt="JobAdys Logo" width={120} height={40} />
          </Link>
          <div className={styles.searchContainer}>
            <svg className={styles.searchIcon} xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z" />
            </svg>
            <input className={styles.search} type="text" placeholder="Search job here..." />
          </div>
        </div>
        <div className={styles.right}>
          <span className={styles.username}>{user?.name || 'Guest'}</span>
          <button onClick={logout} className={styles.logoutButton}>Logout</button>
        </div>
      </nav>
      {user?.role === 'submitter' && <div className={styles.navLinks}>
        <Link href="/submitter/profile" onClick={(e) => handleNavigation(e, '/submitter/profile')}>My Profile</Link>
        <Link href="/submitter" onClick={(e) => handleNavigation(e, '/submitter')}>Dashboard</Link>
        <Link href="/submitter/allOffers" onClick={(e) => handleNavigation(e, '/submitter/allOffers')}>My Offers</Link>
        <Link href="/submitter/newOffer" onClick={(e) => handleNavigation(e, '/submitter/newOffer')}>New Offer</Link>
      </div>}
      {user?.role === 'performer' && <div className={styles.navLinks}>
        <Link href="/performer/profile" onClick={(e) => handleNavigation(e, '/performer/profile')}>My Profile</Link>
        <Link href="/performer" onClick={(e) => handleNavigation(e, '/performer')}>Dashboard</Link>
        <Link href="/performer/allOffers" onClick={(e) => handleNavigation(e, '/performer/allOffers')}>Offers</Link>
      </div>}
    </div>
  );
}
