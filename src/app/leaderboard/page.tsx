import { Suspense } from 'react';
import LeaderboardPage from './leaderboard';


export default function Page() {
  return (
    <Suspense fallback={null}>
      <LeaderboardPage />   
    </Suspense>
  );
}
