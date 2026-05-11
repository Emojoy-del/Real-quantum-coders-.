function Toast({ message, type = "success" }) {
  return (
    <div className={type === "error" ? "error" : "success"}>
      {message}
    </div>
  );
}

export default Toast;