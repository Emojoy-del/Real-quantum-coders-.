function BookingList({ bookings }) {
  return (
    <div>
      <h2>My Bookings</h2>

      {bookings.length === 0 ? (
        <p>No bookings found</p>
      ) : (
        bookings.map((booking) => (
          <div key={booking.id} className="card">
            <p>{booking.eventTitle}</p>
            <p>Tickets: {booking.quantity}</p>
          </div>
        ))
      )}
    </div>
  );
}

export default BookingList;