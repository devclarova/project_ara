import { useEffect, useState } from 'react';
import type { Dialogues } from '../types/database';
import { getClips, getDialogues } from '../services/ClipService';

function CommunityListPage() {
  const [dialogues, setDialogues] = useState<Dialogues[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await getDialogues();
        setDialogues(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <p>Loading...</p>;

  return (
    <ul className="space-y-3">
      {dialogues.map(item => (
        <li key={item.id} className="border rounded p-3">
          <h2 className="font-bold">{item.id}</h2>
          <p>{item.dialogue}</p>
        </li>
      ))}
    </ul>
  );
}

export default CommunityListPage;
