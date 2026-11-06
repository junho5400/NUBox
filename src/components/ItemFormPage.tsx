import { useRef, useState, type FormEvent, type KeyboardEvent, type PointerEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { useActor } from '../hooks/useActor';
import { useDesks, useItem, useItemPrivate, usePhotoUrl } from '../hooks/useData';
import { useStaffDesk } from '../hooks/useStaffDesk';
import { useToast } from '../hooks/useToast';
import { createItem, updateItem } from '../services/items';
import { CATEGORIES, type Category, type Desk, type Item, type ItemInput } from '../types/item';
import { buttonClass } from '../utilities/classes';
import { fromDateInputValue, toDateInputValue } from '../utilities/dates';
import { CENTERED, framedStyle, freeAxis, prepareImage, type Framing } from '../utilities/images';
import { pickableDesks } from '../utilities/items';
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
  framing: Framing;
}

const NUDGE = 0.1;
const clamp = (n: number) => Math.min(1, Math.max(0, n));

const FileInput = ({ onChange }: { onChange: (f: File | null) => void }) => (
  <input type="file" accept="image/*" className="sr-only" onChange={(e) => onChange(e.target.files?.[0] ?? null)} />
);

/** A newly chosen photo, shown exactly as it will be saved. Dragging moves the 4:3 crop along the photo's long side. */
const FramedPhoto = ({ photo, onFrame }: { photo: Photo; onFrame: (f: Framing) => void }) => {
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);
  const drag = useRef<{ start: number; from: number } | null>(null);
  const { framing } = photo;
  const free = size && freeAxis(size.width, size.height, framing.turns);
  const at = (e: PointerEvent) => (free?.axis === 'x' ? e.clientX : e.clientY);
  const move = (to: number) => free && onFrame({ ...framing, [free.axis]: clamp(to) });

  const onKeyDown = (e: KeyboardEvent) => {
    if (!free) return;
    const step = (free.axis === 'x' ? { ArrowLeft: -1, ArrowRight: 1 } : { ArrowUp: -1, ArrowDown: 1 })[e.key as 'ArrowLeft'];
    if (!step) return;
    e.preventDefault();
    move(framing[free.axis] + step * NUDGE);
  };

  return (
    <div className="flex flex-col gap-1.5">
      <div
        {...(free && {
          role: 'slider',
          tabIndex: 0,
          'aria-label': 'Photo position',
          'aria-orientation': free.axis === 'x' ? 'horizontal' : 'vertical',
          'aria-valuemin': 0,
          'aria-valuemax': 100,
          'aria-valuenow': Math.round(framing[free.axis] * 100),
        })}
        onPointerDown={(e) => {
          if (!free) return;
          e.currentTarget.setPointerCapture(e.pointerId);
          drag.current = { start: at(e), from: framing[free.axis] };
        }}
        onPointerMove={(e) => {
          if (!free || !drag.current) return;
          const rect = e.currentTarget.getBoundingClientRect();
          const room = (free.axis === 'x' ? rect.width : rect.height) * free.room;
          move(drag.current.from - (at(e) - drag.current.start) / room);
        }}
        onPointerUp={() => (drag.current = null)}
        onPointerCancel={() => (drag.current = null)}
        onKeyDown={onKeyDown}
        className={`relative aspect-[4/3] overflow-hidden bg-canvas ${
          free ? `cursor-grab active:cursor-grabbing ${free.axis === 'x' ? 'touch-pan-y' : 'touch-none'}` : ''
        }`}
      >
        <img
          src={photo.url}
          alt="Selected photo"
          draggable={false}
          onLoad={(e) => setSize({ width: e.currentTarget.naturalWidth, height: e.currentTarget.naturalHeight })}
          style={size ? framedStyle(size.width, size.height, framing) : undefined}
          className={`absolute max-w-none select-none ${size ? '' : 'invisible'}`}
        />
      </div>
      {free && <p className="text-caption text-ink-3">Drag to choose what’s saved.</p>}
    </div>
  );
};

interface PhotoPickerProps {
  photo: Photo | null;
  existingUrl: string | null;
  onChange: (f: File | null) => void;
  onFrame: (f: Framing) => void;
}

const PhotoPicker = ({ photo, existingUrl, onChange, onFrame }: PhotoPickerProps) => {
  if (!photo && !existingUrl) {
    return (
      <label className="flex aspect-[4/3] cursor-pointer flex-col items-center justify-center gap-1.5 border border-dashed border-line-strong bg-canvas focus-within:border-accent hover:border-ink-3">
        <FileInput onChange={onChange} />
        <Icon name="plus" />
        <span className="font-medium">Add photo</span>
        <span className="text-small text-ink-3">Drop an image or take one</span>
      </label>
    );
  }
  return (
    <div className="flex flex-col gap-3">
      {photo ? (
        <FramedPhoto key={photo.url} photo={photo} onFrame={onFrame} />
      ) : (
        <div className="relative aspect-[4/3] overflow-hidden bg-canvas">
          <img src={existingUrl ?? undefined} alt="Current photo" className="absolute inset-0 size-full object-cover" />
        </div>
      )}
      <div className="flex gap-2">
        {photo && (
          <Button size="sm" onClick={() => onFrame({ ...CENTERED, turns: (photo.framing.turns + 1) % 4 })}>
            Rotate
          </Button>
        )}
        <label className={`${buttonClass('secondary', 'sm')} cursor-pointer has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent`}>
          <FileInput onChange={onChange} />
          Replace photo
        </label>
      </div>
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
      return file ? { file, url: URL.createObjectURL(file), framing: CENTERED } : null;
    });
  const setFraming = (framing: Framing) => setPhotoState((prev) => prev && { ...prev, framing });
  const [showErrors, setShowErrors] = useState(false);
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);
  const existingUrl = usePhotoUrl(item?.photoPath ?? null);
  const deskOptions = pickableDesks(desks, item?.deskId);
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
    const desk = deskOptions.find((d) => d.id === values.deskId);
    if (Object.values(errors).some(Boolean) || !foundOn || !values.category || !desk) return;
    const input: ItemInput = { ...values, category: values.category, foundOn };
    setSaving(true);
    setFailed(false);
    try {
      const blob = photo ? await prepareImage(photo.file, photo.framing) : null;
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
      <PhotoPicker photo={photo} existingUrl={existingUrl} onChange={setPhoto} onFrame={setFraming} />
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
            {(p) => <Select {...p} value={values.deskId} onChange={(v) => set('deskId', v)} options={deskOptions.map((d) => ({ value: d.id, label: d.name }))} />}
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
  const staffDeskActive = desks.status === 'ready' && desks.data.some((d) => d.id === deskId && d.active);
  const initial: FormValues = {
    name: '',
    description: '',
    category: '',
    foundOn: toDateInputValue(new Date()),
    foundAt: '',
    deskId: staffDeskActive ? deskId : '',
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
