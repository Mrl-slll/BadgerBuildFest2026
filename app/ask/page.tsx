import type { Metadata } from 'next';
import Ask from '../../components/ask';

export const metadata: Metadata = {
  title: 'Ask | PCOS health companion',
  description: 'Explore your recorded health history and prepare questions for your care team.',
};
export default function AskPage() { return <Ask />; }
