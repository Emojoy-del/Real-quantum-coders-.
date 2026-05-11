import { useState } from "react";

function BookingForm({ onBook }) {
  const [quantity, setQuantity] = useState(1);

  function handleSubmit(e) {
    e.preventDefault();
    onBook(quantity);
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="number"
        min="1"
        value={quantity}
        onChange={(e) => setQuantity(e.target.value)}
      />

      <button type="submit">Book Ticket</button>
    </form>
  );
}

export default BookingForm;