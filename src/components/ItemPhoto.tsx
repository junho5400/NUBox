import { usePhotoUrl } from '../hooks/useData';
import type { Item } from '../types/item';

interface ItemPhotoProps {
  item: Item;
  /** Staff may see photos of sensitive items; students never do. */
  showSensitive?: boolean;
  /** Size of the category word shown when there is no photo. */
  large?: boolean;
  className?: string;
}

/** Photos are stored as 4:3 (see utilities/images.ts); the frame is 4:3 too, cropping older uploads to match. */
export const ItemPhoto = ({ item, showSensitive = false, large = false, className = '' }: ItemPhotoProps) => {
  const allowed = item.photoPath !== null && (!item.sensitive || showSensitive);
  const url = usePhotoUrl(allowed ? item.photoPath : null);

  return (
    <div className={`relative aspect-[4/3] overflow-hidden bg-canvas ${className}`}>
      {url ? (
        <img src={url} alt={item.name} className="size-full object-cover" />
      ) : (
        !allowed && (
          <span
            className={`absolute bottom-0 left-0 leading-none tracking-[-0.03em] text-ink-3 ${
              large ? 'p-8 text-[3rem]' : 'p-3.5 text-[1.75rem]'
            }`}
          >
            {item.category}
          </span>
        )
      )}
    </div>
  );
};
