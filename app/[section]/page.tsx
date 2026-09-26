import Link from "next/link";
import { notFound } from "next/navigation";
import { EmptyState } from "../../components/ui";

const sections: Record<string, { title: string; description: string }> = {
  track: {
    title: "Track",
    description: "Daily logging isn’t available in this preview yet.",
  },
  insights: {
    title: "Insights",
    description: "Insights aren’t available in this preview yet.",
  },
  ask: {
    title: "Ask",
    description: "The assistant isn’t available in this preview yet.",
  },
};
export default async function SectionPage({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;
  const content = Object.hasOwn(sections, section)
    ? sections[section]
    : undefined;
  if (!content) notFound();
  return (
    <>
      <section className="page-hero">
        <div className="hero-content">
          <p className="hero-badge">Your personal health journal</p>
          <h1>{content.title}</h1>
        </div>
      </section>
      <section className="history-surface">
        <EmptyState title="This part of your journal is on its way">
          {content.description} Return Home to continue with your journal.
        </EmptyState>
        <div className="empty-actions">
          <Link className="button button-primary" href="/">
            Back to Home
          </Link>
        </div>
      </section>
    </>
  );
}
