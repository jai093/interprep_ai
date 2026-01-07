
import React from 'react';

const Spinner: React.FC<{ size?: string }> = ({ size = 'h-8 w-8' }) => {
  return (
    <div className="flex justify-center items-center">
      <div className={`animate-spin rounded-full border-b-2 border-indigo-600 dark:border-indigo-400 ${size}`}></div>
    </div>
  );
};

export const PageSpinner: React.FC<{ message?: string }> = ({ message = 'Loading...' }) => {
    return (
        <div className="flex flex-col items-center justify-center h-full gap-4">
            <Spinner />
            <p className="text-slate-500 dark:text-slate-400">{message}</p>
        </div>
    );
}

export default Spinner;