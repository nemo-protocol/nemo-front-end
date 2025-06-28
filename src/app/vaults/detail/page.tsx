import { Suspense } from 'react';
import VaultsDetailPage from './detail';


export default function Page() {
  return (
    <Suspense fallback={null}>
      <VaultsDetailPage />   
    </Suspense>
  );
}
