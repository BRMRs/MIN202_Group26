import { VALIDATION } from '../../common/utils/constants';

export const getPasswordRules = (password) => ({
  length: password.length >= VALIDATION.MIN_PASSWORD_LENGTH,
  uppercase: /[A-Z]/.test(password),
  number: /\d/.test(password),
  special: /[!@#$%^&*]/.test(password),
  allowedChars: /^[A-Za-z\d!@#$%^&*]*$/.test(password),
});

export const isPasswordValid = (password) => Object.values(getPasswordRules(password)).every(Boolean);

const passwordRuleLabels = {
  length: `At least ${VALIDATION.MIN_PASSWORD_LENGTH} characters`,
  uppercase: 'One uppercase letter',
  number: 'One number',
  special: 'One special character (!@#$%^&*)',
  allowedChars: 'Only letters, numbers, and allowed special characters',
};

function PasswordRequirements({ password }) {
  const rules = getPasswordRules(password);

  return (
    <div className="password-requirements">
      <div className="password-requirements-title">Password requirements:</div>
      {Object.entries(passwordRuleLabels).map(([key, label]) => {
        const passed = rules[key];
        return (
          <div
            key={key}
            className={`password-rule ${passed ? 'valid' : 'invalid'}`}
          >
            <span className="password-rule-icon">{passed ? '✓' : '✕'}</span>
            <span>{label}</span>
          </div>
        );
      })}
    </div>
  );
}

export default PasswordRequirements;
