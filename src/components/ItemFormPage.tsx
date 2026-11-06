import { useCallback, useEffect, useRef, useState, type FormEvent, type KeyboardEvent, type PointerEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { useActor } from '../hooks/useActor';
import { useDesks, useItem, useItemPrivate, usePhotoUrl } from '../hooks/useData';
import { useStaffDesk } from '../hooks/useStaffDesk';
import { useToast } from '../hooks/useToast';
import { createItem, updateItem } from '../services/items';
import { CATEGORIES, type Category, type Desk, type Item, type ItemInput } from '../types/item';
import { buttonClass } from '../utilities/classes';
import { fromDateInputValue, toDateInputValue } from '../utilities/dates';
import { CENTERED, canPan, framedStyle, maxZoom, panBy, prepareImage, zoomTo, type Framing } from '../utilities/images';
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

type Reframe = (change: (f: Framing) => Framing) => void;

/** Arrow keys move the photo by this much of the frame; + and - zoom by this factor. */
const NUDGE = 0.1;
const ZOOM_STEP = 1.25;

const FileInput = ({ onChange }: { onChange: (f: File | null) => void }) => (
  <input type="file" accept="image/*" className="sr-only" onChange={(e) => onChange(e.target.files?.[0] ?? null)} />
);

const distance = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.hypot(a.x - b.x, a.y - b.y);

/**
 * A newly chosen photo, shown exactly as it will be saved. It starts zoomed out
 * so the whole photo shows; staff zoom (slider, wheel, or pinch) and drag to
 * choose what fills the frame.
 */
const FramedPhoto = ({ photo, onFrame }: { photo: Photo; onFrame: Reframe }) => {
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);
  const frame = useRef<HTMLDivElement>(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinch = useRef<{ dist: number; zoom: number } | null>(null);
  const { framing } = photo;
  const pannable = size !== null && canPan(size.width, size.height, framing);
  const top = size ? maxZoom(size.width, size.height, framing.turns) : 1;

  const zoom = (to: (z: number) => number) => size && onFrame((f) => zoomTo(size.width, size.height, f, to(f.zoom)));
  const pan = (dx: number, dy: number) => size && onFrame((f) => panBy(size.width, size.height, f, dx, dy));

  // React's wheel listener is passive, so it can't stop the page from scrolling.
  useEffect(() => {
    const el = frame.current;
    if (!el || !size) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      onFrame((f) => zoomTo(size.width, size.height, f, f.zoom * Math.exp(-e.deltaY / 300)));
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [size, onFrame]);

  const onPointerDown = (e: PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const [a, b] = [...pointers.current.values()];
    pinch.current = b ? { dist: distance(a, b), zoom: framing.zoom } : null;
  };

  const onPointerMove = (e: PointerEvent) => {
    const last = pointers.current.get(e.pointerId);
    if (!last || !size) return;
    const now = { x: e.clientX, y: e.clientY };
    pointers.current.set(e.pointerId, now);
    const [a, b] = [...pointers.current.values()];
    if (b && pinch.current) {
      const start = pinch.current;
      zoom(() => (start.zoom * distance(a, b)) / start.dist);
    } else {
      const rect = e.currentTarget.getBoundingClientRect();
      pan((now.x - last.x) / rect.width, (now.y - last.y) / rect.height);
    }
  };

  const onPointerEnd = (e: PointerEvent) => {
    pointers.current.delete(e.pointerId);
    pinch.current = null;
  };

  const onKeyDown = (e: KeyboardEvent) => {
    const step = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.key];
    if (step) pan(-step[0] * NUDGE, -step[1] * NUDGE);
    else if (e.key === '+' || e.key === '=') zoom((z) => z * ZOOM_STEP);
    else if (e.key === '-') zoom((z) => z / ZOOM_STEP);
    else return;
    e.preventDefault();
  };

  return (
    <div className="flex flex-col gap-2">
      <div
        ref={frame}
        tabIndex={0}
        aria-label="Photo framing. Arrow keys move the photo, plus and minus zoom."
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerEnd}
        onPointerCancel={onPointerEnd}
        onKeyDown={onKeyDown}
        className={`relative aspect-[4/3] touch-none overflow-hidden bg-canvas ${pannable ? 'cursor-grab active:cursor-grabbing' : ''}`}
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
      {size && (
        <label className="flex items-center gap-3 text-small text-ink-3">
          Zoom
          <input
            type="range"
            min={0}
            max={1}
            step={0.001}
            // Logarithmic, so each bit of the slider zooms by the same factor.
            value={Math.log(framing.zoom) / Math.log(top)}
            onChange={(e) => zoom(() => top ** Number(e.target.value))}
            className="flex-1 accent-accent"
          />
        </label>
      )}
    </div>
  );
};

interface PhotoPickerProps {
  photo: Photo | null;
  existingUrl: string | null;
  onChange: (f: File | null) => void;
  onFrame: Reframe;
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
          <img src={existingUrl ?? undefined} alt="Current photo" className="absolute inset-0 size-full object-contain" />
        </div>
      )}
      <div className="flex gap-2">
        {photo && (
          <Button size="sm" onClick={() => onFrame((f) => ({ ...CENTERED, turns: (f.turns + 1) % 4 }))}>
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
  // Stable, so FramedPhoto's wheel listener isn't re-added on every render.
  const reframe = useCallback<Reframe>(
    (change) => setPhotoState((prev) => prev && { ...prev, framing: change(prev.framing) }),
    [],
  );
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
      <PhotoPicker photo={photo} existingUrl={existingUrl} onChange={setPhoto} onFrame={reframe} />
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
