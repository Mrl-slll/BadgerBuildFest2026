import { auth } from "@clerk/nextjs/server";
import { HomeOverview } from "../components/home-overview";
import { LandingPage } from "../components/landing-page";
import { dateKey, emptyData } from "../lib/health";

export default async function Home() {
  const { userId } = await auth();

  if (!userId) {
    return <LandingPage />;
  }

  const today = dateKey();
  return <HomeOverview data={emptyData()} today={today} />;
}
