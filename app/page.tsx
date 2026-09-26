import { HomeOverview } from "../components/home-overview";
import { dateKey, seedData } from "../lib/health";

export default function Home() {
  const today = dateKey();
  return <HomeOverview data={seedData(today)} today={today} />;
}
