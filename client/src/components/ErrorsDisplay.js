import React from 'react';
import { useEffect } from "react";

const ErrorsDisplay = ({ errors }) => {
  let errorsDisplay = null;

  useEffect(() => {

  }, [errors])

  if (errors.length) {
    errorsDisplay = (
      <div>
        <h2 className="validation--errors--label">Validation errors</h2>
        <div className="validation-errors">
          <ul>
            {errors.map((error, i) => <li key={i}>{error}</li>)}
          </ul>
        </div>
      </div>
    );
  }

  return errorsDisplay;
}

export default ErrorsDisplay;