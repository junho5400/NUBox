import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { useActor } from '../hooks/useActor';
import { useDesks, useItem, useItemPrivate, usePhotoUrl } from '../hooks/useData';
import { ALL_DESKS, useStaffDesk } from '../hooks/useStaffDesk';
import { useToast } from '../hooks/useToast';
import { createItem, updateItem } from '../services/items';
import { CATEGORIES, type Category, type Desk, type Item, type ItemInput } from '../types/item';
import { buttonClass } from '../utilities/classes';
import { fromDateInputValue, toDateInputValue } from '../utilities/dates';
import { prepareImage } from '../utilities/images';
import { Button } from './Button';
import { Field } from './Field';
import { Icon } from './Icon';
import { PageTitle } from './PageTitle';
import { Select } from './Select';
import { Checkbox, TextArea, TextInput } from './Controls';
import { BackLink } from './BackLink';

interface FormValues {
  name: string;
  description: string;
  category: Category | '';
  foundOn: string;
  foundAt: string;
  deskId: string;
  sensitive: boolean;
  privateDetails: string;
}

interface Photo {
  file: File;
  url: string;
}

const PhotoPicker = ({ photo, existingUrl, onChange }: { photo: Photo | null; existingUrl: string | null; onChange: (f: File | null) => void }) => {
  const shown = photo?.url ?? existingUrl;
  return (
    <div className="flex flex-col gap-1.5">
      <label className="relative flex aspect-[4/3] cursor-pointer flex-col items-center justify-center gap-1.5 overflow-hidden border border-dashed border-line-strong bg-canvas focus-within:border-accent hover:border-ink-3">
        <input type="file" accept="image/*" className="sr-only" onChange={(e) => onChange(e.target.files?.[0] ?? null)} />
        {shown ? (
          <>
            <img src={shown} alt="Selected photo" className="absolute inset-0 size-full object-cover" />
            <span className="absolute right-3 bottom-3 bg-surface px-3 py-1.5 text-small font-medium">Replace photo</span>
          </>
        ) : (
          <>
            <Icon name="plus" />
            <span className="font-medium">Add photo</span>
            <span className="text-small text-ink-3">Drop an image or take one</span>
          </>
        )}
      </label>
      <p className="text-caption text-ink-3">Photos are saved at 4:3, cropped from the center as shown.</p>
    </div>
  );
};

interface FormProps {
  item?: Item;
  initial: FormValues;
  desks: Desk[];
}

const ItemForm = ({ item, initial, desks }: FormProps) => {
  const actor = useActor();
  const toast = useToast();
  const navigate = useNavigate();
  const [values, setValues] = useState(initial);
  const [photo, setPhotoState] = useState<Photo | null>(null);
  const setPhoto = (file: File | null) =>
    setPhotoState((prev) => {
      if (prev) URL.revokeObjectURL(prev.url);
      return file ? { file, url: URL.createObjectURL(file) } : null;
    });
  const [showErrors, setShowErrors] = useState(false);
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);
  const existingUrl = usePhotoUrl(item?.photoPath ?? null);
  const set = <K extends keyof FormValues>(key: K, value: FormValues[K]) => setValues((v) => ({ ...v, [key]: value }));

  const foundOn = fromDateInputValue(values.foundOn);
  const errors = {
    name: values.name.trim() ? undefined : 'Add a name.',
    category: values.category ? undefined : 'Choose a category.',
    foundOn: foundOn ? undefined : 'Enter a date.',
    deskId: values.deskId ? undefined : 'Choose a desk.',
  };
  const err = (key: keyof typeof errors) => (showErrors ? errors[key] : undefined);

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const another = (e.nativeEvent as SubmitEvent).submitter?.getAttribute('value') === 'another';
    setShowErrors(true);
    const desk = desks.find((d) => d.id === values.deskId);
    if (Object.values(errors).some(Boolean) || !foundOn || !values.category || !desk) return;
    const input: ItemInput = { ...values, category: values.category, foundOn };
    setSaving(true);
    setFailed(false);
    try {
      const blob = photo ? await prepareImage(photo.file) : null;
      if (item) {
        await updateItem(item, input, blob, actor);
        toast('Saved');
        navigate(`/inventory/${item.id}`);
      } else {
        const created = await createItem(input, blob, desk, actor);
        toast(`Logged ${created.number}`);
        if (another) {
          setValues({
            ...initial,
            deskId: values.deskId,
            foundOn: values.foundOn,
          });
          setPhoto(null);
          setShowErrors(false);
          window.scrollTo({ top: 0 });
        } else {
          navigate(`/inventory/${created.id}`);
        }
      }
    } catch (error) {
      console.error(error);
      setFailed(true);
    } finally {
      setSaving(false);
    }
  };

  const text = (key: 'name' | 'foundAt', placeholder?: string) => (p: object) => (
    <TextInput {...p} value={values[key]} placeholder={placeholder} onChange={(e) => set(key, e.target.value)} />
  );

  return (
    <form onSubmit={submit} noValidate className="grid gap-10 pb-16 lg:grid-cols-[minmax(0,28rem)_minmax(0,36rem)] lg:gap-16">
      <PhotoPicker photo={photo} existingUrl={existingUrl} onChange={setPhoto} />
      <div className="flex flex-col gap-5">
        <Field label="Name" hint="Keep it general. Students see this." error={err('name')}>
          {text('name', 'Wallet')}
        </Field>
        <Field label="Description" hint="Students see this too.">
          {(p) => <TextArea {...p} value={values.description} placeholder="Color, size, brand" onChange={(e) => set('description', e.target.value)} />}
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Category" error={err('category')}>
            {(p) => (
              <Select
                {...p}
                value={values.category}
                onChange={(v) => set('category', v as Category)}
                options={CATEGORIES.map((c) => ({ value: c, label: c }))}
              />
            )}
          </Field>
          <Field label="Found on" error={err('foundOn')}>
            {(p) => <TextInput {...p} type="date" value={values.foundOn} max={toDateInputValue(new Date())} onChange={(e) => set('foundOn', e.target.value)} />}
          </Field>
          <Field label="Found at">{text('foundAt', 'Building and room')}</Field>
          <Field label="Held at" error={err('deskId')}>
            {(p) => <Select {...p} value={values.deskId} onChange={(v) => set('deskId', v)} options={desks.map((d) => ({ value: d.id, label: d.name }))} />}
          </Field>
        </div>
        <Checkbox checked={values.sensitive} onChange={(e) => set('sensitive', e.target.checked)} label="Sensitive item" hint="Students won’t see the photo." />
        <Field label="Private details" hint="Only staff can see this.">
          {(p) => (
            <TextArea
              {...p}
              value={values.privateDetails}
              placeholder="Anything that proves ownership"
              onChange={(e) => set('privateDetails', e.target.value)}
            />
          )}
        </Field>
        {failed && <p className="text-small text-danger">Couldn’t save. Check your connection and try again.</p>}
        <div className="flex flex-wrap gap-2 pt-2">
          <Button variant="primary" type="submit" value="save" disabled={saving}>
            {saving ? 'Saving' : 'Save'}
          </Button>
          {!item && (
            <Button type="submit" value="another" disabled={saving}>
              Save and log another
            </Button>
          )}
          <Link to={item ? `/inventory/${item.id}` : '/inventory'} className={buttonClass('quiet')}>
            Cancel
          </Link>
        </div>
      </div>
    </form>
  );
};

export const NewItemPage = () => {
  const desks = useDesks();
  const { deskId } = useStaffDesk();
  const initial: FormValues = {
    name: '',
    description: '',
    category: '',
    foundOn: toDateInputValue(new Date()),
    foundAt: '',
    deskId: deskId === ALL_DESKS ? '' : deskId,
    sensitive: false,
    privateDetails: '',
  };
  return (
    <div className="px-4 pt-6 md:px-8">
      <BackLink to="/inventory">Inventory</BackLink>
      <PageTitle>Log item</PageTitle>
      {desks.status === 'ready' ? <ItemForm initial={initial} desks={desks.data} /> : <p className="text-ink-3">Loading</p>}
    </div>
  );
};

export const EditItemPage = () => {
  const { id = '' } = useParams();
  const item = useItem(id);
  const priv = useItemPrivate(id);
  const desks = useDesks();

  if (item.status === 'error' || (item.status === 'ready' && !item.data)) return <p className="p-8 text-heading">This item doesn’t exist.</p>;
  if (item.status !== 'ready' || !item.data || priv.status === 'loading' || desks.status !== 'ready') return <p className="p-8 text-ink-3">Loading</p>;

  const it = item.data;
  const initial: FormValues = {
    name: it.name,
    description: it.description,
    category: it.category,
    foundOn: toDateInputValue(it.foundOn),
    foundAt: it.foundAt,
    deskId: it.deskId,
    sensitive: it.sensitive,
    privateDetails: priv.status === 'ready' ? priv.data.details : '',
  };
  return (
    <div className="px-4 pt-6 md:px-8">
      <BackLink to={`/inventory/${it.id}`}>Inventory</BackLink>
      <PageTitle>Edit {it.number}</PageTitle>
      <ItemForm key={it.id} item={it} initial={initial} desks={desks.data} />
    </div>
  );
};
