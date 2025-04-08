import '@/styles/globals.css';
// import styles from '@/styles/Auth/Layout.module.css';

export default function AUTHLayout({ children }) {
  return (
    <div >
      <main>
        {children}
      </main>
    </div>
  )
}