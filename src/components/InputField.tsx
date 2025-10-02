// src/components/InputField.tsx
import React from "react";

type InputFieldProps = {
  label: string;
  type: string;
  value: string;
  placeholder: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void; // ✅ tambahin ini
  className?: string;
};

const InputField: React.FC<InputFieldProps> = ({
  label,
  type,
  value,
  placeholder,
  onChange,
  onBlur,
  className = "",
}) => {
  return (
    <div className={`w-full ${className}`}>
      <label className="block mb-2 font-medium text-left font-inter">
        {label}
      </label>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={onChange}
        onBlur={onBlur}
        className="font-inter border bg-tertiary border-quaternary text-quinary p-2 rounded w-full box-border"
      />
    </div>
  );
};

export default InputField;
