import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
} from "react";

const ToastContext = createContext();

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context.showToast;
};

// ✅ FIXED: Keyframes injection inside effect
const injectKeyframes = () => {
  if (typeof document === "undefined") return;
  if (document.getElementById("toast-keyframes")) return;

  const style = document.createElement("style");
  style.id = "toast-keyframes";
  style.textContent = `
    @keyframes toastSlideIn {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
  `;
  document.head.appendChild(style);
};

const ToastItem = ({ id, message, type, onDismiss }) => {
  const bgColorMap = {
    success: "#4caf50",
    error: "#f44336",
    warning: "#ff9800",
    info: "#2196f3",
  };

  return (
    <div
      role="alert"
      aria-live="assertive" // ✅ More urgent than "polite"
      style={{
        position: "relative",
        backgroundColor: bgColorMap[type] || "#333",
        color: "white",
        padding: "12px 16px",
        borderRadius: "8px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
        maxWidth: "500px",
        wordBreak: "break-word",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        animation: "toastSlideIn 0.3s ease-out forwards",
      }}
    >
      <span>{message}</span>
      <button
        onClick={() => onDismiss(id)}
        aria-label="Dismiss notification"
        style={{
          background: "none",
          border: "none",
          color: "white",
          fontSize: "18px",
          cursor: "pointer",
          marginLeft: "12px",
          padding: "4px",
          borderRadius: "4px",
        }}
        onMouseEnter={(e) =>
          (e.target.style.backgroundColor = "rgba(255,255,255,0.2)")
        }
        onMouseLeave={(e) => (e.target.style.backgroundColor = "transparent")}
      >
        &times;
      </button>
    </div>
  );
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const toastTimeouts = useRef(new Map());

  // ✅ FIXED: Inject keyframes safely
  useEffect(() => {
    injectKeyframes();

    return () => {
      toastTimeouts.current.forEach((timeoutId) => {
        clearTimeout(timeoutId);
      });
      toastTimeouts.current.clear();
    };
  }, []);

  const showToast = useCallback((message, type = "info", duration = 5000) => {
    setToasts((prevToasts) => {
      const now = Date.now();
      if (
        prevToasts.some(
          (t) => t.message === message && now - t.timestamp < 1000
        )
      ) {
        return prevToasts;
      }

      const id = now + Math.random();
      const timestamp = now;

      if (duration > 0) {
        const timeoutId = setTimeout(() => {
          setToasts((current) => current.filter((t) => t.id !== id));
          toastTimeouts.current.delete(id);
        }, duration);
        toastTimeouts.current.set(id, timeoutId);
      }

      return [...prevToasts, { id, message, type, timestamp }];
    });
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    if (toastTimeouts.current.has(id)) {
      clearTimeout(toastTimeouts.current.get(id));
      toastTimeouts.current.delete(id);
    }
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* ✅ FIXED: ARIA container for all toasts */}
      <div
        aria-live="assertive"
        aria-atomic="true"
        style={{
          position: "fixed",
          top: "20px",
          right: "20px",
          zIndex: 10000,
          display: "flex",
          flexDirection: "column",
          gap: "10px",
        }}
      >
        {toasts.map((toast) => (
          <ToastItem
            key={toast.id}
            id={toast.id}
            message={toast.message}
            type={toast.type}
            onDismiss={dismissToast}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
};
