import React from 'react';

type Props = {
  src?: string | null;
  alt?: string;
  className?: string;
  /** Font Awesome class for the placeholder, e.g. "fa-image", "fa-user". */
  icon?: string;
  /** Placeholder icon size; defaults to something sensible for a card. */
  iconClassName?: string;
  title?: string;
};

/**
 * An image that degrades to a Font Awesome glyph instead of the browser's
 * broken-image icon. Covers both cases: no src at all, and a src that fails to
 * load (a deleted upload, or a path the API no longer serves).
 */
const ImageWithFallback: React.FC<Props> = ({
  src,
  alt = '',
  className = '',
  icon = 'fa-image',
  iconClassName = 'text-3xl',
  title,
}) => {
  const [failed, setFailed] = React.useState(false);

  // A changed src deserves another attempt; without this a single failure
  // would keep showing the placeholder even after the image is replaced.
  React.useEffect(() => setFailed(false), [src]);

  const missing = !src || !src.trim() || failed;

  if (missing) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-100 text-gray-400 ${className}`}
        title={title ?? alt ?? 'No image'}
        aria-label={alt || 'No image'}
        role="img"
      >
        <i className={`fa ${icon} ${iconClassName}`} aria-hidden="true" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      title={title}
      className={className}
      onError={() => setFailed(true)}
      loading="lazy"
    />
  );
};

export default ImageWithFallback;
