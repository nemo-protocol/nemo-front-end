import { Suspense } from 'react';
import PointsPage from './Points';

export default function Page() {
  return (
    <Suspense fallback={null}>
      <PointsPage />
    </Suspense>
  );
}