import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/SelectRole.css';

const SelectRole = () => {
  const navigate = useNavigate();

  return (
    <div className="role-container">
      <h1 className="role-title">Choose Your Role</h1>
      <p className="role-subtitle">Select how you want to contribute to the community</p>

      <div className="role-cards">
        {/* Citizen Card */}
        <div className="role-card" onClick={() => navigate('/citizen-signup')}>
          <span className="role-icon" role="img" aria-label="citizen">🧑‍🤝‍🧑</span>
          <h2>Citizen</h2>
          <p>Report issues, track status, and help improve your neighborhood.</p>
        </div>

        {/* Officer Card */}
        <div className="role-card" onClick={() => navigate('/officer/register')}>
          <span className="role-icon" role="img" aria-label="officer">👮‍♀️</span>
          <h2>Officer</h2>
          <p>Manage reports, verify issues, and coordinate resolutions.</p>
        </div>
      </div>

      <p className="login-prompt">
        Already have an account?{' '}
        <span className="login-link" onClick={() => navigate('/login')}>
          Login here
        </span>
      </p>
    </div>
  );
};

export default SelectRole;