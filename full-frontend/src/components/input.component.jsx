import { useState } from "react";

const InputBox = ({ name, type, id, value, placeholder, icon, onChange, disabled = false }) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";

  return (
    <div className="relative w-full mb-4">
      <input
        name={name}
        type={isPassword ? (showPassword ? "text" : "password") : type}
        id={id}
        defaultValue={value}
        placeholder={placeholder}
        onChange={onChange}
        disabled={disabled}
        className="input-box"
      />
      <i className={`fi ${icon} input-icon text-gray-400`}></i>
      {isPassword && (
        <button
          type="button"
          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          onClick={() => setShowPassword(v => !v)}
        >
          <i className={`fi ${showPassword ? "fi-rr-eye-crossed" : "fi-rr-eye"}`}></i>
        </button>
      )}
    </div>
  );
};

export default InputBox;
