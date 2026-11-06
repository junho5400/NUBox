import { useState, type FormEvent } from 'react';
import { useActor } from '../hooks/useActor';
import { useToast } from '../hooks/useToast';
import { closeItem } from '../services/items';
import type { Disposal, Item } from '../types/item';
import { Button } from './Button';
import { Dialog } from './Dialog';
import { TextArea, Radio } from './Controls';
import { Field } from './Field';

interface Props {
  item: Item;
  open: boolean;
  onClose: () => void;
}

const METHODS: { value: Disposal['method']; label: string; done: string }[] = [
  { value: 'donated', label: 'Donate', done: 'Donated' },
  { value: 'discarded', label: 'Discard', done: 'Discarded' },
];

export const CloseDialog = ({ item, open, onClose }: Props) => {
  const actor = useActor();
  const toast = useToast();
  const [method, setMethod] = useState<Disposal['method']>('donated');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);
  const chosen = METHODS.find((m) => m.value === method) ?? METHODS[0];

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFailed(false);
    try {
      await closeItem(item, method, note, actor);
      toast(`${chosen.done} ${item.name}`);
      onClose();
    } catch (error) {
      console.error(error);
      setFailed(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} title={`Donate or discard ${item.name}`} onClose={onClose}>
      <form onSubmit={submit} className="flex flex-col gap-5">
        <fieldset className="flex gap-6">
          <legend className="sr-only">Action</legend>
          {METHODS.map((m) => (
            <Radio key={m.value} name="method" value={m.value} checked={method === m.value} onChange={() => setMethod(m.value)} label={m.label} />
          ))}
        </fieldset>
        <Field label="Note" hint="Optional">
          {(p) => <TextArea {...p} value={note} onChange={(e) => setNote(e.target.value)} rows={2} />}
        </Field>
        <p className="text-small text-ink-2">It will no longer be listed for students.</p>
        {failed && <p className="text-small text-danger">Couldn’t save. Try again.</p>}
        <div className="flex justify-end gap-2">
          <Button variant="quiet" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="destructive" type="submit" disabled={saving}>
            {chosen.label}
          </Button>
        </div>
      </form>
    </Dialog>
  );
};
