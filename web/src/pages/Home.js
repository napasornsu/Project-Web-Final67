import { auth } from "../firebaseConfig";
import { useNavigate } from "react-router-dom";

const Home = ({ user }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    auth.signOut();
    navigate("/");
  };

  return (
    <div>
      <h1>Welcome, {user.displayName}</h1>
      <img src={user.photoURL} alt="Profile" width="100" />
      <p>Email: {user.email}</p>
      <button onClick={() => navigate("/edit-profile")}>Edit Profile</button>
      <button onClick={() => navigate("/add-subject")}>Add Subject</button>
      <button onClick={handleLogout}>Logout</button>
      <button onClick={() => navigate("/subjects")}>View Subjects</button>
    </div>
  );
};

export default Home;
