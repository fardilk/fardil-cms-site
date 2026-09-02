import React from 'react';

type BaseProps = {
  label?: string;
  hint?: string;
  required?: boolean;
  className?: string;
};

export const FieldShell: React.FC<BaseProps & { children: React.ReactNode; htmlFor?: string }> = ({
  label,
  hint,
  required,
  className = '',
  htmlFor,
  children,
}) => (
  <div className={className}>
    {label && (
      <label className="p-label" htmlFor={htmlFor}>
        {label}
        {required && <span className="ml-0.5 text-[var(--p-critical)]">*</span>}
      </label>
    )}
    {children}
    {hint && <p className="mt-1 text-xs text-[var(--p-text-secondary)]">{hint}</p>}
  </div>
);

let seq = 0;
const nextId = () => `f${(seq += 1)}`;

export const TextField: React.FC<
  BaseProps & {
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    type?: string;
  }
> = ({ label, hint, required, className, value, onChange, placeholder, type = 'text' }) => {
  const id = React.useMemo(nextId, []);
  return (
    <FieldShell label={label} hint={hint} required={required} className={className} htmlFor={id}>
      <input
        id={id}
        type={type}
        className="p-field"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </FieldShell>
  );
};

export const TextArea: React.FC<
  BaseProps & {
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    rows?: number;
  }
> = ({ label, hint, required, className, value, onChange, placeholder, rows = 3 }) => {
  const id = React.useMemo(nextId, []);
  return (
    <FieldShell label={label} hint={hint} required={required} className={className} htmlFor={id}>
      <textarea
        id={id}
        rows={rows}
        className="p-field"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </FieldShell>
  );
};

export const SelectField: React.FC<
  BaseProps & {
    value: string;
    onChange: (v: string) => void;
    options: Array<{ value: string; label: string }>;
  }
> = ({ label, hint, required, className, value, onChange, options }) => {
  const id = React.useMemo(nextId, []);
  return (
    <FieldShell label={label} hint={hint} required={required} className={className} htmlFor={id}>
      <select id={id} className="p-field" value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </FieldShell>
  );
};

export const Toggle: React.FC<{
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}> = ({ label, hint, checked, onChange }) => (
  <label className="flex cursor-pointer items-start gap-2.5">
    <input
      type="checkbox"
      className="mt-0.5 h-4 w-4 accent-[#303030]"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
    />
    <span>
      <span className="block text-[0.8125rem] text-[var(--p-text)]">{label}</span>
      {hint && <span className="block text-xs text-[var(--p-text-secondary)]">{hint}</span>}
    </span>
  </label>
);
