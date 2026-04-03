import { useState } from "react";

export default function useToast() {
  const [message, setMessage] = useState(null);

  const showToast = (msg, type = "info") => {
    setMessage({ text: msg, type });

    setTimeout(() => {
      setMessage(null);
    }, 3000);
  };

  return { message, showToast };
}
