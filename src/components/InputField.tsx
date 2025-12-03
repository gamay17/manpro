import React from "react";

type InputFieldProps = {
  label: string;
  type: string;
  value: string;
  placeholder: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
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
      <label className="block mb-2 font-medium text-left font-inter text-quinary">
        {label}
      </label>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={onChange}
        onBlur={onBlur}
        className="font-inter border-1 border-primary bg-tertiary text-quinary px-3 py-2 
             rounded-xl w-full box-border shadow-sm transition-all duration-200 
              focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
      />
    </div>
  );
};

export default InputField;
