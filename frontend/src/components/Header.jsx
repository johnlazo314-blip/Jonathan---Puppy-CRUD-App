const Header = ({ onLogout }) => {
  return (
    <header className="app-header">
      <div className="header-glow"></div>
      <h1>Puppy Manager</h1>
      <p>Track, add, edit, and manage your puppy records.</p>
      {onLogout && (
        <button className="btn logout-btn" type="button" onClick={onLogout}>
          Log Out
        </button>
      )}
    </header>
  )
}

export default Header
