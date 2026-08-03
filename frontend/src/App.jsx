import Login from "./components/Login";

function App() {
  const handleLoginSuccess = (user) => {
    console.log("Logged in:", user);
  };

  return <Login onLoginSuccess={handleLoginSuccess} />;
}

export default App;