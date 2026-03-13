import { useState, useEffect } from 'react';
import ImageUpload from '@/components/image-upload';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

const ENTRIES = [
  { id: 'iocrops', title: 'ioCrops · IoT Hardware QA Engineer' },
  { id: 'workaway', title: 'Workaway — Sahainan (Thailand) · A Little Wild (Malaysia)' },
  { id: 'justbe', title: 'JustBe Temple (Hongdae) — Eco Community Manager' },
  { id: 'wellness-cert', title: 'Wellness Expert LV2 · Mindfulness Practical Instructor' },
  { id: 'yeongwol', title: 'Yeongwol Youth Village-Building Project' },
  { id: 'vipassana', title: 'Dhamma Korea Vipassana · Temple Kitchen' },
  { id: 'marketing', title: 'Performance Marketing · YouTube Channel' },
  { id: 'workingholiday', title: 'Working Holiday — France & Australia' },
  { id: 'army', title: 'Republic of Korea Army — 22nd Div., 56th Regiment' },
  { id: 'undergrad', title: 'Undergraduate Studies' },
];

const SLOT_LABELS = ['Photo 1', 'Photo 2', 'Photo 3'];

type ImageMap = Record<string, string[]>;

async function saveImages(entryId: string, images: string[]) {
  const res = await fetch('/api/admin/timeline-images', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ entryId, images }),
  });
  if (!res.ok) throw new Error('Save failed');
}

export default function TimelineImageManager() {
  const { toast } = useToast();
  const [imageMap, setImageMap] = useState<ImageMap>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/timeline-images', { credentials: 'include' })
      .then(r => r.ok ? r.json() : {})
      .then((data: Record<string, { images: string[] }>) => {
        const map: ImageMap = {};
        for (const [id, v] of Object.entries(data)) map[id] = v.images || [];
        setImageMap(map);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleChange = async (entryId: string, slotIndex: number, url: string) => {
    const current = imageMap[entryId] || ['', '', ''];
    const updated = [...current];
    // ensure array is at least 3 slots
    while (updated.length < 3) updated.push('');
    updated[slotIndex] = url;
    // only keep non-empty values for storage, but keep local state with slots
    const toSave = updated.filter(Boolean);
    try {
      await saveImages(entryId, toSave);
      setImageMap(prev => ({ ...prev, [entryId]: updated }));
      if (url) {
        toast({ title: 'Image saved' });
      } else {
        toast({ title: 'Image removed' });
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to save', variant: 'destructive' });
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-gray-500 text-sm">Loading timeline images...</div>;
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">
        Upload up to 3 photos per entry. They appear as a photo strip in the detail panel on the About page.
      </p>
      {ENTRIES.map(entry => {
        const slots = imageMap[entry.id] || ['', '', ''];
        // ensure 3 slots always present in local state
        while (slots.length < 3) slots.push('');
        return (
          <Card key={entry.id}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-800">{entry.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {SLOT_LABELS.map((label, i) => (
                  <div key={i} className="space-y-1">
                    <p className="text-xs text-gray-400 font-medium">{label}</p>
                    <ImageUpload
                      value={slots[i] || ''}
                      onChange={url => handleChange(entry.id, i, url)}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
