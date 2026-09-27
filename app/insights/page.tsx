import Insights from '../../components/insights';
import { dateKey, emptyData } from '../../lib/health';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Health history | PCOS insights', description: 'Explore recorded health patterns and prepare a descriptive visit summary.' };
export default function InsightsPage() {
  const end = dateKey();
  return <Insights data={emptyData()} end={end}/>;
}
