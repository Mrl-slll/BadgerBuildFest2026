import type { Metadata } from "next";
import { auth } from "@clerk/nextjs/server";
import Ask from "../../components/ask";
import { AskPreview } from "../../components/landing-page";

export const metadata: Metadata = {
  title: "Ask | PCOS health companion",
  description: "Explore your recorded health history and prepare questions for your care team.",
};

export default async function AskPage() {
  const { userId } = await auth();

  if (!userId) {
    return <AskPreview />;
  }

  return <Ask />;
}
