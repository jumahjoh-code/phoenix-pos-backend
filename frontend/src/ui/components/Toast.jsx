import { useEffect, useState } from "react";

export default function Toast({ toast }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (toast) {
      setVisible(true);

      const timer = setTimeout(() => {
        setVisible(false);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [toast]);

  if (!toast || !visible) return null;

  const type = toast.type || "success";

  return (
    <div className={`toast toast-${type}`}>
      {toast.message}
    </div>
  );
}