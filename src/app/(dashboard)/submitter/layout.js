// src/app/(dashboard)/submitter/layout.js
export const metadata = {
  title: 'JobAdys - Submitter',
  description: 'JobAdys freelancing platform for submitters',
};

export default function SubmitterLayout({ children }) {
  return (
    <div className="submitter-layout">
      {children}
    </div>
  );
}
  