import { Suspense } from 'react';
import PortfolioPage from './Portfolio';

export default function Page() {
  return (
    <Suspense fallback={null}>
      <PortfolioPage />
    </Suspense>
  );
}
