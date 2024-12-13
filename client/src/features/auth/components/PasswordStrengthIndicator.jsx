import React, { useState, useEffect } from 'react';

export default function PasswordStrengthIndicator({ password }) {
  const [strength, setStrength] = useState(0);
  const [checks, setChecks] = useState({
    minLength: false,
    hasNumber: false,
    hasSpecial: false,
    hasLetter: false
  });

  useEffect(() => {
    const newChecks = {
      minLength: password.length >= 8,
      hasNumber: /\d/.test(password),
      hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password),
      hasLetter: /[a-zA-Z]/.test(password)
    };
    
    setChecks(newChecks);
    
    // Calcola il punteggio di forza
    const strengthScore = Object.values(newChecks).filter(Boolean).length;
    setStrength(strengthScore);
  }, [password]);

  return (
    <div className="mt-2">
      <div className="flex space-x-1 mb-2">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className={`h-2 flex-1 rounded-full transition-colors ${
              i < strength 
                ? strength === 1 
                  ? 'bg-red-500' 
                  : strength === 2 
                    ? 'bg-yellow-500'
                    : strength === 3
                      ? 'bg-blue-500'
                      : 'bg-green-500'
                : 'bg-gray-200'
            }`}
          />
        ))}
      </div>
      
      <ul className="space-y-1 text-sm">
        <li className={`flex items-center ${checks.minLength ? 'text-green-600' : 'text-gray-500'}`}>
          <span className="mr-2">{checks.minLength ? '✓' : '○'}</span>
          Almeno 8 caratteri
        </li>
        <li className={`flex items-center ${checks.hasNumber ? 'text-green-600' : 'text-gray-500'}`}>
          <span className="mr-2">{checks.hasNumber ? '✓' : '○'}</span>
          Almeno un numero
        </li>
        <li className={`flex items-center ${checks.hasLetter ? 'text-green-600' : 'text-gray-500'}`}>
          <span className="mr-2">{checks.hasLetter ? '✓' : '○'}</span>
          Almeno una lettera
        </li>
        <li className={`flex items-center ${checks.hasSpecial ? 'text-green-600' : 'text-gray-500'}`}>
          <span className="mr-2">{checks.hasSpecial ? '✓' : '○'}</span>
          Almeno un carattere speciale
        </li>
      </ul>
    </div>
  );
}