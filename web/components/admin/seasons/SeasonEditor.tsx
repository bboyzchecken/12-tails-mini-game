'use client';

import { useEffect, useState } from 'react';
import {
  type Collection,
  type CosmeticItem,
  fromLocalInput,
  toLocalInput,
  useCreateCollection,
  useCreateItem,
  useDeleteItem,
  useUpdateCollection,
  useUpdateItem,
} from '@/lib/api/seasons';
import { statusLabel, STATUS_META } from '@/lib/store/liveness';

const STATUS_OPTS = [
  { value: 'draft', label: 'ร่าง (ปิด)' },
  { value: 'scheduled', label: 'ตั้งเวลา (ตามวันที่)' },
  { value: 'live', label: 'บังคับเปิดขาย' },
  { value: 'ended', label: 'จบแล้ว (ปิด)' },
];
const TYPE_OPTS = ['skin', 'color', 'emote', 'chat_frame'];
const RARITY_OPTS = ['common', 'rare', 'epic'];

/** Right-side drawer to create/edit a season + manage its items. */
export function SeasonEditor({
  collection,
  onClose,
  onCreated,
}: {
  collection: Collection | null; // null = create new
  onClose: () => void;
  onCreated: (id: string) => void;
}) {
  const isNew = !collection;
  const [name, setName] = useState('');
  const [theme, setTheme] = useState('');
  const [status, setStatus] = useState('draft');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [archived, setArchived] = useState(false);
  const [err, setErr] = useState('');

  const create = useCreateCollection();
  const update = useUpdateCollection();

  // Re-seed the form only when the target collection changes (by id), so an
  // item mutation refetch doesn't clobber what the operator is typing.
  useEffect(() => {
    setName(collection?.name ?? '');
    setTheme(collection?.theme ?? '');
    setStatus(collection?.status ?? 'draft');
    setStart(toLocalInput(collection?.sale_start));
    setEnd(toLocalInput(collection?.sale_end));
    setArchived(collection?.is_archived ?? false);
    setErr('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collection?.id]);

  const startIso = fromLocalInput(start);
  const endIso = fromLocalInput(end);
  const windowInvalid = !!startIso && !!endIso && new Date(endIso) <= new Date(startIso);
  const previewLabel = statusLabel(status, startIso, endIso);

  async function save() {
    if (!name.trim()) {
      setErr('ต้องมีชื่อคอลเลกชัน');
      return;
    }
    if (windowInvalid) {
      setErr('วันสิ้นสุดต้องหลังวันเริ่ม');
      return;
    }
    setErr('');
    const input = {
      name: name.trim(),
      theme: theme.trim() || null,
      status,
      sale_start: startIso,
      sale_end: endIso,
      is_archived: archived,
    };
    try {
      if (isNew) {
        const created = await create.mutateAsync(input);
        onCreated(created.id); // switch drawer to edit mode → items enabled
      } else {
        await update.mutateAsync({ id: collection!.id, input });
      }
    } catch {
      setErr('บันทึกไม่สำเร็จ');
    }
  }

  const saving = create.isPending || update.isPending;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/30" onClick={onClose}>
      <div
        className="h-full w-full max-w-lg overflow-y-auto bg-cream p-5 shadow-panel"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center gap-3">
          <h2 className="font-head text-xl text-ink">{isNew ? 'สร้างคอลเลกชัน' : 'แก้ไขคอลเลกชัน'}</h2>
          <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${STATUS_META[previewLabel].className}`}>
            {STATUS_META[previewLabel].label}
          </span>
          <button type="button" className="btn btn-ghost ml-auto px-3 py-1" onClick={onClose}>
            ปิด
          </button>
        </div>

        {/* collection form */}
        <div className="panel flex flex-col gap-3 p-4">
          <label className="flex flex-col text-xs text-muted">
            ชื่อ
            <input className="field mt-1" value={name} onChange={(e) => setName(e.target.value)} placeholder="ชุดฤดูร้อน 2026" />
          </label>
          <label className="flex flex-col text-xs text-muted">
            ธีม (theme)
            <input className="field mt-1" value={theme} onChange={(e) => setTheme(e.target.value)} placeholder="summer" />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col text-xs text-muted">
              เริ่มขาย
              <input type="datetime-local" className="field mt-1" value={start} onChange={(e) => setStart(e.target.value)} />
            </label>
            <label className="flex flex-col text-xs text-muted">
              สิ้นสุด
              <input type="datetime-local" className="field mt-1" value={end} onChange={(e) => setEnd(e.target.value)} />
            </label>
          </div>
          <label className="flex flex-col text-xs text-muted">
            สถานะ / override
            <select className="field mt-1" value={status} onChange={(e) => setStatus(e.target.value)}>
              {STATUS_OPTS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 text-xs text-muted">
            <input type="checkbox" checked={archived} onChange={(e) => setArchived(e.target.checked)} />
            เก็บถาวร (ซ่อนจากรายการหลัก)
          </label>

          {err && <p className="text-sm text-danger">{err}</p>}
          <button type="button" className="btn btn-primary self-start" disabled={saving} onClick={save}>
            {saving ? 'กำลังบันทึก…' : isNew ? 'สร้างคอลเลกชัน' : 'บันทึก'}
          </button>
        </div>

        {/* items — only after the collection exists */}
        {collection ? (
          <ItemsSection collection={collection} />
        ) : (
          <p className="mt-4 text-center text-xs text-muted">บันทึกคอลเลกชันก่อน แล้วจึงเพิ่มไอเทมได้</p>
        )}
      </div>
    </div>
  );
}

function ItemsSection({ collection }: { collection: Collection }) {
  const items = collection.items ?? [];
  return (
    <div className="panel mt-4 p-4">
      <h3 className="mb-3 font-head text-base text-ink">ไอเทมในคอลเลกชัน ({items.length})</h3>
      <div className="flex flex-col gap-2">
        {items.map((it) => (
          <ItemRow key={it.id} collectionId={collection.id} item={it} />
        ))}
      </div>
      <AddItem collectionId={collection.id} />
    </div>
  );
}

/** One editable item row — holds its own local state so a list refetch (same
 * key) never clobbers an in-progress edit. */
function ItemRow({ collectionId, item }: { collectionId: string; item: CosmeticItem }) {
  const [name, setName] = useState(item.name);
  const [type, setType] = useState(item.type);
  const [price, setPrice] = useState(String(item.price_jil));
  const [rarity, setRarity] = useState(item.rarity);
  const [active, setActive] = useState(item.active);
  const update = useUpdateItem();
  const del = useDeleteItem();

  const dirty =
    name !== item.name ||
    type !== item.type ||
    price !== String(item.price_jil) ||
    rarity !== item.rarity ||
    active !== item.active;

  return (
    <div className="rounded-lg border border-line bg-white p-2.5">
      <div className="flex flex-wrap items-center gap-2">
        <input className="field min-w-0 flex-1 py-1 text-sm" value={name} onChange={(e) => setName(e.target.value)} />
        <select className="field py-1 text-xs" value={type} onChange={(e) => setType(e.target.value)}>
          {TYPE_OPTS.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <input
          type="number"
          className="field w-20 py-1 text-sm"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          title="Jil"
        />
        <select className="field py-1 text-xs" value={rarity} onChange={(e) => setRarity(e.target.value)}>
          {RARITY_OPTS.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-1 text-xs text-muted">
          <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
          ขาย
        </label>
        <button
          type="button"
          className="btn btn-ghost px-2 py-1 text-xs disabled:opacity-40"
          disabled={!dirty || update.isPending}
          onClick={() =>
            update.mutate({
              collectionId,
              itemId: item.id,
              input: { name: name.trim(), type, price_jil: Number(price) || 0, rarity, active },
            })
          }
        >
          บันทึก
        </button>
        <button
          type="button"
          className="btn btn-ghost px-2 py-1 text-xs text-danger"
          disabled={del.isPending}
          onClick={() => del.mutate({ collectionId, itemId: item.id })}
        >
          ✕
        </button>
      </div>
    </div>
  );
}

function AddItem({ collectionId }: { collectionId: string }) {
  const [name, setName] = useState('');
  const [type, setType] = useState('skin');
  const [price, setPrice] = useState('300');
  const [rarity, setRarity] = useState('common');
  const create = useCreateItem();

  function add() {
    if (!name.trim()) return;
    create.mutate(
      { collectionId, input: { name: name.trim(), type, price_jil: Number(price) || 0, rarity, preview: 'placeholder' } },
      { onSuccess: () => setName('') },
    );
  }

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-line pt-3">
      <input
        className="field min-w-0 flex-1 py-1 text-sm"
        placeholder="ชื่อไอเทมใหม่"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <select className="field py-1 text-xs" value={type} onChange={(e) => setType(e.target.value)}>
        {TYPE_OPTS.map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </select>
      <input type="number" className="field w-20 py-1 text-sm" value={price} onChange={(e) => setPrice(e.target.value)} />
      <select className="field py-1 text-xs" value={rarity} onChange={(e) => setRarity(e.target.value)}>
        {RARITY_OPTS.map((r) => (
          <option key={r} value={r}>
            {r}
          </option>
        ))}
      </select>
      <button type="button" className="btn btn-primary px-3 py-1 text-xs" disabled={create.isPending} onClick={add}>
        + เพิ่ม
      </button>
    </div>
  );
}
