import { Suspense } from 'react';
import VaultsPage from './vaults';


export default function Page() {
  return (
    <Suspense fallback={null}>
      <VaultsPage />   
    </Suspense>
  );
}
