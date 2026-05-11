export default function AuthLayout({ children }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "#0f172a",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "400px",
          padding: "20px",
        }}
      >
        {children}
      </div>
    </div>
  );
}