import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, Loader, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import PasswordStrengthIndicator from "./components/PasswordStrengthIndicator";
import { authService } from '../../services/authService';

export default function Register() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  const validateStep1 = () => {
    const errors = {};
    if (!formData.name.trim()) {
      errors.name = 'Il nome è obbligatorio';
    }
    if (!formData.email.trim()) {
      errors.email = 'L\'email è obbligatoria';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Email non valida';
    }
    return errors;
  };

  const validateStep2 = () => {
    const errors = {};
    if (!formData.password) {
      errors.password = 'La password è obbligatoria';
    } else if (formData.password.length < 8) {
      errors.password = 'La password deve essere di almeno 8 caratteri';
    }
    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Conferma la password';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Le password non coincidono';
    }
    if (!formData.acceptTerms) {
      errors.acceptTerms = 'Devi accettare i termini e le condizioni';
    }
    return errors;
  };

  const handleNextStep = () => {
    const errors = validateStep1();
    if (Object.keys(errors).length === 0) {
      setStep(2);
      setFormErrors({});
    } else {
      setFormErrors(errors);
    }
  };


    const handleSubmit = async (e) => {
      e.preventDefault();
      const errors = validateStep2();
      if (Object.keys(errors).length > 0) {
        setFormErrors(errors);
        return;
      }
  
      setIsLoading(true);
      try {
        const result = await authService.register({
          name: formData.name,
          email: formData.email,
          password: formData.password
        });
          
        if (result.success) {
          navigate('/login', { 
            state: { 
              message: 'Registrazione completata con successo! Effettua il login.',
              type: 'success' 
            } 
          });
          return;
        }
  
       throw new Error(result.message || 'Errore durante la registrazione');
  
      } catch (err) {
        if (err.response?.data?.errors) {
          const backendErrors = {};
          err.response.data.errors.forEach(error => {
            backendErrors[error.field] = error.message;
          });
          setFormErrors(backendErrors);
        } else {
          setFormErrors({ 
            general: err.response?.data?.message || 'Si è verificato un errore durante la registrazione' 
          });
        }
      } finally {
        setIsLoading(false);
      }
    };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <Link to="/" className="text-3xl font-bold text-blue-600">
            CodeLearning
          </Link>
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
          {step === 1 ? 'Crea il tuo account' : 'Completa la registrazione'}
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl rounded-lg sm:px-10">
          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex justify-between">
              <div className="flex-1">
                <div className={`h-2 rounded-l-full ${step >= 1 ? 'bg-blue-600' : 'bg-gray-200'}`} />
              </div>
              <div className="flex-1">
                <div className={`h-2 rounded-r-full ${step >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`} />
              </div>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {step === 1 ? (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="space-y-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                      Nome completo
                    </label>
                    <div className="mt-1">
                      <input
                        id="name"
                        name="name"
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className={`appearance-none block w-full px-3 py-2 border ${
                          formErrors.name ? 'border-red-300' : 'border-gray-300'
                        } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                      />
                      {formErrors.name && (
                        <p className="mt-2 text-sm text-red-600">{formErrors.name}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                      Email
                    </label>
                    <div className="mt-1">
                      <input
                        id="email"
                        name="email"
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className={`appearance-none block w-full px-3 py-2 border ${
                          formErrors.email ? 'border-red-300' : 'border-gray-300'
                        } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                      />
                      {formErrors.email && (
                        <p className="mt-2 text-sm text-red-600">{formErrors.email}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <button
                      type="button"
                      onClick={handleNextStep}
                      className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Continua
                    </button>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    Password
                  </label>
                  <div className="mt-1 relative">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className={`appearance-none block w-full px-3 py-2 border ${
                        formErrors.password ? 'border-red-300' : 'border-gray-300'
                      } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5 text-gray-400" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                  </div>
                  {formErrors.password && (
                    <p className="mt-2 text-sm text-red-600">{formErrors.password}</p>
                  )}
                  <PasswordStrengthIndicator password={formData.password} />
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                    Conferma Password
                  </label>
                  <div className="mt-1 relative">
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      className={`appearance-none block w-full px-3 py-2 border ${
                        formErrors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                      } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-5 w-5 text-gray-400" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                  </div>
                  {formErrors.confirmPassword && (
                    <p className="mt-2 text-sm text-red-600">{formErrors.confirmPassword}</p>
                  )}
                </div>

                <div>
                  <div className="flex items-center">
                    <input
                      id="acceptTerms"
                      name="acceptTerms"
                      type="checkbox"
                      checked={formData.acceptTerms}
                      onChange={(e) => setFormData({ ...formData, acceptTerms: e.target.checked })}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="acceptTerms" className="ml-2 block text-sm text-gray-900">
                      Accetto i <a href="#" className="text-blue-600 hover:text-blue-500">termini</a> e le <a href="#" className="text-blue-600 hover:text-blue-500">condizioni</a>
                    </label>
                  </div>
                  {formErrors.acceptTerms && (
                    <p className="mt-2 text-sm text-red-600">{formErrors.acceptTerms}</p>
                  )}
                </div>

                <div className="flex space-x-4">
                  <button
                    type="button"
                    onClick={() => {
                      setStep(1);
                      setFormErrors({});
                    }}
                    className="flex-1 flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <ArrowLeft className="h-5 w-5 mr-2" />
                    Indietro
                  </button>
                  <button
                    type="submit"
                    onClick={handleSubmit}
                    disabled={isLoading}
                    className="flex-1 flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    {isLoading ? (
                      <Loader className="h-5 w-5 animate-spin" />
                    ) : (
                      'Registrati'
                    )}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <p className="mt-6 text-center text-sm text-gray-600">
            Hai già un account?{' '}
            <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">
              Accedi
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}