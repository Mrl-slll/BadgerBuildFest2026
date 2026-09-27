import Insights from '../../components/insights';
import { dateKey } from '../../lib/health';
import { sampleHealthData } from '../../lib/sample-data';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Health history | PCOS insights', description: 'Explore recorded health patterns and prepare a descriptive visit summary.' };
export default function InsightsPage() {
  const end = dateKey();
  return <Insights data={sampleHealthData} end={end}/>;
}
