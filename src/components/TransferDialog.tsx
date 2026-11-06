import { useState, type FormEvent } from 'react';
import { useActor } from '../hooks/useActor';
import { useToast } from '../hooks/useToast';
import { transferItem } from '../services/items';
import type { Desk, Item } from '../types/item';
import { Button } from './Button';
import { Dialog } from './Dialog';
import { Field } from './Field';
import { Select } from './Select';

interface Props {
  item: Item;
  desks: Desk[];
  open: boolean;
  onClose: () => void;
}

export const TransferDialog = ({ item, desks, open, onClose }: Props) => {
  const actor = useActor();
  const toast = useToast();
  const options = desks.filter((d) => d.active && d.id !== item.deskId);
  const [toId, setToId] = useState('');
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);
  const to = options.find((d) => d.id === toId);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!to) return;
    setSaving(true);
    setFailed(false);
    try {
      await transferItem(item, desks.find((d) => d.id === item.deskId), to, actor);
      toast(`Transferred to ${to.name}`);
      onClose();
    } catch (error) {
      console.error(error);
      setFailed(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} title={`Transfer ${item.name}`} onClose={onClose}>
      <form onSubmit={submit} className="flex flex-col gap-5">
        <Field label="To">
          {(p) => (
            <Select {...p} value={toId} onChange={setToId} placeholder="Choose a desk" options={options.map((d) => ({ value: d.id, label: d.name }))} />
          )}
        </Field>
        {failed && <p className="text-small text-danger">Couldn’t transfer. Try again.</p>}
        <div className="flex justify-end gap-2">
          <Button variant="quiet" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" disabled={!to || saving}>
            {saving ? 'Transferring' : 'Transfer'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
};
