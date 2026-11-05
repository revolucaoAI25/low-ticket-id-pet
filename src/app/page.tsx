import { Quiz } from '@/components/quiz/Quiz';
import { withDemoProof } from '@/config/demo-proof';
import { getSettings } from '@/lib/server/settings';

export default async function Home() {
  const settings = withDemoProof(await getSettings());
  return <Quiz settings={settings} />;
}
