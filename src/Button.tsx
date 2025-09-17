import './Button.css';

/**
 * A component to use in place of native HTML buttons,
 * to ensure consistent extra structure that allows for shrinking the visual button
 * in the active state without affecting the actual hitbox
 */
function Button({ children, type, ...htmlButtonProps }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <div className="button-component component-wrapper">
      <button type={type} {...htmlButtonProps}>
        <span className="button-shell">
          {children}
        </span>
      </button>
    </div>
  );
}

export default Button;
