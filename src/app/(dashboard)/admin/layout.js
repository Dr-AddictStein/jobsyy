// src/app/(dashboard)/performer/layout.js
export const metadata = {
  title: 'JobAdys - Performer',
  description: 'JobAdys freelancing platform for performers',
};

export default function PerformerLayout({ children }) {
  return (
    <div className="performer-layout">
      {children}
    </div>
  );
}
  