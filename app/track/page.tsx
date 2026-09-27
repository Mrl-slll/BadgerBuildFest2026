import type { Metadata } from "next";
import { auth } from "@clerk/nextjs/server";
import { TrackingWorkspace } from "../../components/tracking-workspace";
import { TrackPreview } from "../../components/landing-page";
import "./tracking.css";

export const metadata: Metadata = {
  title: "Track your health",
  description: "Your daily symptoms, cycles, medications, and lab records.",
};

export default async function TrackPage() {
  const { userId } = await auth();

  if (!userId) {
    return <TrackPreview />;
  }

  return <TrackingWorkspace />;
}
