import { useState, type FormEvent } from 'react';
import { useActor } from '../hooks/useActor';
import { useToast } from '../hooks/useToast';
import { releaseItem } from '../services/items';
import type { Item } from '../types/item';
import { Button } from './Button';
import { Dialog } from './Dialog';
import { Radio, TextArea, TextInput } from './Controls';
import { Field } from './Field';

interface Props {
  item: Item;
  open: boolean;
  onClose: () => void;
}

type Claimant = 'northwestern' | 'visitor';

const CLAIMANTS: { value: Claimant; label: string }[] = [
  { value: 'northwestern', label: 'Northwestern' },
  { value: 'visitor', label: 'Visitor' },
];

export const ReleaseDialog = ({ item, open, onClose }: Props) => {
  const actor = useActor();
  const toast = useToast();
  const [claimant, setClaimant] = useState<Claimant>('northwestern');
  const [name, setName] = useState('');
  const [netid, setNetid] = useState('');
  const [contact, setContact] = useState('');
  const [note, setNote] = useState('');
  const [showErrors, setShowErrors] = useState(false);
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);
  const visitor = claimant === 'visitor';

  const errors = {
    name: name.trim() ? undefined : 'Enter their name.',
    netid: visitor || netid.trim() ? undefined : 'Enter their NetID.',
    contact: !visitor || contact.trim() ? undefined : 'Enter a phone number or email.',
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setShowErrors(true);
    if (errors.name || errors.netid || errors.contact) return;
    setSaving(true);
    setFailed(false);
    try {
      await releaseItem(item, { netid: visitor ? '' : netid, name, contact: visitor ? contact : '', note }, actor);
      toast(`Released to ${visitor ? name.trim() : netid.trim().toLowerCase()}`);
      onClose();
    } catch (error) {
      console.error(error);
      setFailed(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} title={`Release ${item.name}`} onClose={onClose}>
      <form onSubmit={submit} noValidate className="flex flex-col gap-5">
        <fieldset className="flex gap-6">
          <legend className="sr-only">Who’s picking it up</legend>
          {CLAIMANTS.map((c) => (
            <Radio key={c.value} name="claimant" value={c.value} checked={claimant === c.value} onChange={() => setClaimant(c.value)} label={c.label} />
          ))}
        </fieldset>
        <Field label="Name" error={showErrors ? errors.name : undefined}>
          {(p) => <TextInput {...p} value={name} onChange={(e) => setName(e.target.value)} autoComplete="off" />}
        </Field>
        {visitor ? (
          <Field key="contact" label="Phone or email" error={showErrors ? errors.contact : undefined}>
            {(p) => <TextInput {...p} value={contact} onChange={(e) => setContact(e.target.value)} autoComplete="off" />}
          </Field>
        ) : (
          <Field key="netid" label="NetID" error={showErrors ? errors.netid : undefined}>
            {(p) => <TextInput {...p} value={netid} onChange={(e) => setNetid(e.target.value)} autoComplete="off" />}
          </Field>
        )}
        <Field label="How they proved it’s theirs" hint="Optional">
          {(p) => <TextArea {...p} value={note} onChange={(e) => setNote(e.target.value)} rows={2} />}
        </Field>
        {failed && <p className="text-small text-danger">Couldn’t release. Try again.</p>}
        <div className="flex justify-end gap-2">
          <Button variant="quiet" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" disabled={saving}>
            {saving ? 'Releasing' : 'Release'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
};
