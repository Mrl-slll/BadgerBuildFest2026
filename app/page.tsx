import { HomeOverview } from "../components/home-overview";
import { dateKey, emptyData } from "../lib/health";

export default function Home() {
  const today = dateKey();
  return <HomeOverview data={emptyData()} today={today} />;
}
