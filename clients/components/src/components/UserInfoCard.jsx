function UserInfoCard({ user }) {
  return (
    <div className="card">
      <h3>User Info</h3>

      <p>Name: {user?.name}</p>

      <p>Email: {user?.email}</p>
    </div>
  );
}

export default UserInfoCard;