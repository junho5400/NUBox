import { useState, type FormEvent } from 'react';
import { useActor } from '../hooks/useActor';
import { useToast } from '../hooks/useToast';
import { reopenItem } from '../services/items';
import type { Item } from '../types/item';
import { Button } from './Button';
import { Dialog } from './Dialog';
import { TextArea } from './Controls';
import { Field } from './Field';

interface Props {
  item: Item;
  /** "Undo release" and the like. */
  label: string;
  open: boolean;
  onClose: () => void;
}

export const ReopenDialog = ({ item, label, open, onClose }: Props) => {
  const actor = useActor();
  const toast = useToast();
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFailed(false);
    try {
      await reopenItem(item, note, actor);
      toast(`${item.name} is back in custody`);
      onClose();
    } catch (error) {
      console.error(error);
      setFailed(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} title={`${label} of ${item.name}`} onClose={onClose}>
      <form onSubmit={submit} className="flex flex-col gap-5">
        <Field label="Reason" hint="Optional">
          {(p) => <TextArea {...p} value={note} onChange={(e) => setNote(e.target.value)} rows={2} />}
        </Field>
        <p className="text-small text-ink-2">It goes back in custody and is listed for students again.</p>
        {failed && <p className="text-small text-danger">Couldn’t undo. Try again.</p>}
        <div className="flex justify-end gap-2">
          <Button variant="quiet" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" disabled={saving}>
            Undo
          </Button>
        </div>
      </form>
    </Dialog>
  );
};
