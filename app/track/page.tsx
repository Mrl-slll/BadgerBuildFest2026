import type { Metadata } from "next";
import { TrackingWorkspace } from "../../components/tracking-workspace";
import "./tracking.css";

export const metadata: Metadata = {
  title: "Track your health",
  description: "Your daily symptoms, cycles, medications, and lab records.",
};
export default function TrackPage() {
  return <TrackingWorkspace />;
}
