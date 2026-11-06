import { useState, type FormEvent } from 'react';
import { useUser } from '../hooks/useActor';
import { useDesks, useRoles } from '../hooks/useData';
import { useToast } from '../hooks/useToast';
import { addEvanstonDesks, saveDesk } from '../services/desks';
import { grantRole, revokeRole, type StaffRole } from '../services/roles';
import type { Desk } from '../types/item';
import { isNorthwesternEmail } from '../utilities/email';
import { Button } from './Button';
import { Field } from './Field';
import { PageTitle } from './PageTitle';
import { Select } from './Select';
import { Tag } from './Tag';
import { Checkbox, TextInput } from './Controls';

const ROLE_LABELS: Record<StaffRole, string> = { admin: 'Staff', superadmin: 'Super-admin' };

const People = () => {
  const user = useUser();
  const roles = useRoles();
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<StaffRole>('admin');
  const [error, setError] = useState<string>();

  const add = async (e: FormEvent) => {
    e.preventDefault();
    if (!isNorthwesternEmail(email.trim())) return setError('Use a Northwestern email address.');
    setError(undefined);
    try {
      await grantRole(email, role, user.email);
      toast(`Added ${email.trim().toLowerCase()}`);
      setEmail('');
    } catch (err) {
      console.error(err);
      setError('Couldn’t add. Try again.');
    }
  };

  const remove = async (target: string) => {
    try {
      await revokeRole(target);
      toast(`Removed ${target}`);
    } catch (err) {
      console.error(err);
      toast('Couldn’t remove. Try again.');
    }
  };

  return (
    <section aria-labelledby="people" className="flex flex-col gap-6">
      <div>
        <h2 id="people" className="text-title">People</h2>
        <p className="text-ink-2">Staff can log and release items. Super-admins can also manage people and desks.</p>
      </div>
      <form onSubmit={add} noValidate className="flex flex-wrap items-start gap-3">
        <div className="w-full sm:w-80">
          <Field label="Email" error={error}>
            {(p) => <TextInput {...p} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="netid@northwestern.edu" />}
          </Field>
        </div>
        <div className="w-40">
          <Field label="Role">
            {(p) => (
              <Select
                {...p}
                value={role}
                onChange={(v) => setRole(v as StaffRole)}
                options={[
                  { value: 'admin', label: 'Staff' },
                  { value: 'superadmin', label: 'Super-admin' },
                ]}
              />
            )}
          </Field>
        </div>
        <Button variant="primary" type="submit" className="sm:mt-[1.625rem]">
          Add
        </Button>
      </form>
      {roles.status === 'ready' && (
        <ul className="border-b border-line">
          {roles.data.map((g) => (
            <li key={g.email} className="flex items-center gap-4 border-t border-line py-3">
              <span className="min-w-0 flex-1 truncate">{g.email}</span>
              <span className="w-28 text-small text-ink-2">{ROLE_LABELS[g.role]}</span>
              <Button variant="quiet" size="sm" disabled={g.email === user.email.toLowerCase()} onClick={() => remove(g.email)}>
                Remove
              </Button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};

const EMPTY_DESK: Desk = { id: '', name: '', place: '', hours: '', contact: '', bring: 'Your Wildcard', holdingDays: 30, active: true };

const DeskForm = ({ desk, onDone }: { desk: Desk; onDone: () => void }) => {
  const toast = useToast();
  const [values, setValues] = useState(desk);
  const [showErrors, setShowErrors] = useState(false);
  const [failed, setFailed] = useState(false);
  const set = <K extends keyof Desk>(key: K, value: Desk[K]) => setValues((v) => ({ ...v, [key]: value }));
  const errors = {
    name: values.name.trim() ? undefined : 'Add a name.',
    holdingDays: values.holdingDays >= 1 ? undefined : 'Enter at least 1 day.',
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setShowErrors(true);
    if (errors.name || errors.holdingDays) return;
    try {
      await saveDesk({
        ...values,
        name: values.name.trim(),
        place: values.place.trim(),
        hours: values.hours.trim(),
        contact: values.contact.trim(),
        bring: values.bring.trim(),
      });
      toast(`Saved ${values.name.trim()}`);
      onDone();
    } catch (err) {
      console.error(err);
      setFailed(true);
    }
  };

  const input = (key: 'name' | 'place' | 'hours' | 'contact' | 'bring', placeholder: string) => (p: object) => (
    <TextInput {...p} value={values[key]} placeholder={placeholder} onChange={(e) => set(key, e.target.value)} />
  );

  return (
    <form onSubmit={submit} noValidate className="grid gap-4 border-t border-line py-5 sm:grid-cols-2">
      <Field label="Name" error={showErrors ? errors.name : undefined}>{input('name', 'Norris Center')}</Field>
      <Field label="Where">{input('place', 'Building and desk')}</Field>
      <Field label="Hours">{input('hours', 'While the building is open')}</Field>
      <Field label="Contact">{input('contact', 'Phone or email')}</Field>
      <Field label="Bring">{input('bring', 'Your Wildcard')}</Field>
      <Field label="Hold for (days)" hint="Items past this are flagged." error={showErrors ? errors.holdingDays : undefined}>
        {(p) => <TextInput {...p} type="number" min={1} value={values.holdingDays} onChange={(e) => set('holdingDays', Number(e.target.value))} />}
      </Field>
      <Checkbox
        checked={values.active}
        onChange={(e) => set('active', e.target.checked)}
        label="Active"
        hint="Inactive desks can’t take new items. Items already there stay listed."
        className="sm:col-span-2"
      />
      <div className="flex gap-2 sm:col-span-2">
        <Button variant="primary" type="submit">Save</Button>
        <Button variant="quiet" onClick={onDone}>Cancel</Button>
      </div>
      {failed && <p className="text-small text-danger sm:col-span-2">Couldn’t save. Try again.</p>}
    </form>
  );
};

const Desks = () => {
  const desks = useDesks();
  const toast = useToast();
  const [editing, setEditing] = useState<string | null>(null);

  const addDefaults = async () => {
    try {
      await addEvanstonDesks();
      toast('Added 4 desks');
    } catch (err) {
      console.error(err);
      toast('Couldn’t add desks. Try again.');
    }
  };

  return (
    <section aria-labelledby="desks" className="flex flex-col gap-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 id="desks" className="text-title">Desks</h2>
          <p className="text-ink-2">Shown to students on each item.</p>
        </div>
        {editing === null && desks.status === 'ready' && desks.data.length > 0 && (
          <Button size="sm" icon="plus" onClick={() => setEditing('new')}>Add desk</Button>
        )}
      </div>
      {desks.status === 'ready' && desks.data.length === 0 && editing === null && (
        <div className="flex flex-wrap gap-2">
          <Button variant="primary" onClick={addDefaults}>Add the 4 Evanston desks</Button>
          <Button onClick={() => setEditing('new')}>Add a desk</Button>
        </div>
      )}
      <div className="border-b border-line">
        {editing === 'new' && <DeskForm desk={EMPTY_DESK} onDone={() => setEditing(null)} />}
        {desks.status === 'ready' &&
          desks.data.map((d) =>
            editing === d.id ? (
              <DeskForm key={d.id} desk={d} onDone={() => setEditing(null)} />
            ) : (
              <div key={d.id} className="flex items-start gap-4 border-t border-line py-4">
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 font-medium">
                    {d.name}
                    {!d.active && <Tag>Inactive</Tag>}
                  </p>
                  <p className="text-small text-ink-2">{[d.place, d.hours, `Holds ${d.holdingDays} days`, d.contact].filter(Boolean).join('. ')}</p>
                </div>
                <Button variant="quiet" size="sm" onClick={() => setEditing(d.id)}>Edit</Button>
              </div>
            ),
          )}
      </div>
    </section>
  );
};

export const SettingsPage = () => (
  <div className="px-4 pb-16 md:px-8">
    <PageTitle>Settings</PageTitle>
    <div className="flex max-w-3xl flex-col gap-16 pt-2">
      <People />
      <Desks />
    </div>
  </div>
);
