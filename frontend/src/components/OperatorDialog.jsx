import React, { useState } from 'react';
import { User, ShieldCheck } from 'lucide-react';
import { useOperator } from '../hooks/useOperator';

export function OperatorDialog() {
  const { operator, setOperator, isDialogOpen, setIsDialogOpen } = useOperator();
  const [nameInput, setNameInput] = useState(operator || '');
  const [error, setError] = useState('');

  if (!isDialogOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!nameInput.trim()) {
      setError('Please enter your name or duty callsign to proceed.');
      return;
    }
    setOperator(nameInput);
    setError('');
  };

  return (
    <div className="fixed inset-0 bg-crevasse/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm select-none">
      <div className="bg-paper border border-borderHairline rounded-lg shadow-modal w-full max-w-md p-6 text-granite animate-fadeIn">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2.5 bg-glacial/10 text-glacial rounded-full">
            <User className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-display font-bold text-xl text-crevasse tracking-wide">
              Operator Sign-in
            </h2>
            <p className="text-xs text-granite/70">
              GlacierWatch Rasuwa Riverside Field Console
            </p>
          </div>
        </div>

        <p className="text-sm text-granite/80 mb-4 leading-relaxed">
          Every lake classification verification and emergency SMS dispatch is cryptographically audited and permanently attributed to on-duty personnel.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="operator-name" className="block text-xs font-semibold text-crevasse uppercase tracking-wider mb-1">
              Duty Officer / Operator Name
            </label>
            <input
              id="operator-name"
              type="text"
              value={nameInput}
              onChange={(e) => {
                setNameInput(e.target.value);
                if (error) setError('');
              }}
              placeholder="e.g. Ramesh K.C. (Disaster Response Officer)"
              autoFocus
              className="w-full px-3 py-2 border border-granite/20 rounded focus:border-glacial focus:ring-1 focus:ring-glacial text-sm bg-white font-sans"
            />
            {error && <p className="text-xs text-rhododendron mt-1">{error}</p>}
          </div>

          <div className="flex items-center justify-end space-x-3 pt-2">
            {operator && (
              <button
                type="button"
                onClick={() => setIsDialogOpen(false)}
                className="px-4 py-2 text-xs font-medium text-granite/70 hover:text-granite transition-colors"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              className="px-5 py-2 bg-glacial hover:bg-cyan-800 text-white font-medium text-xs rounded transition-colors flex items-center space-x-1.5 shadow-sm"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Confirm identity</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
