interface InputFieldProps {
  label: string;
  type?: string;
  id: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
}

export default function InputField({
  label,
  type = 'text',
  id,
  value,
  onChange,
  placeholder,
  required = false,
  disabled = false,
}: InputFieldProps) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold text-slate-300 mb-2">
        {label}
      </label>
      <input
        type={type}
        id={id}
        value={value}
        onChange={onChange}
        className="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-900/80 text-slate-100 placeholder:text-slate-500 shadow-sm transition-all outline-none selection:bg-teal-500 selection:text-slate-950 focus:border-teal-400 focus:ring-4 focus:ring-teal-500/15 focus:bg-slate-900 disabled:bg-slate-900/40 disabled:text-slate-500 disabled:cursor-not-allowed"
        placeholder={placeholder}
        required={required}
        disabled={disabled}
      />
    </div>
  );
}
