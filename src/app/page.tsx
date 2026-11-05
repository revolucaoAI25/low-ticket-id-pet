import { Quiz } from '@/components/quiz/Quiz';
import { getSettings } from '@/lib/server/settings';

export default async function Home() {
  const settings = await getSettings();
  return <Quiz settings={settings} />;
}
