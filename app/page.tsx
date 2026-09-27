import { HomeOverview } from "../components/home-overview";
import { dateKey } from "../lib/health";
import { sampleHealthData } from "../lib/sample-data";

export default function Home() {
  const today = dateKey();
  return <HomeOverview data={sampleHealthData} today={today} />;
}
