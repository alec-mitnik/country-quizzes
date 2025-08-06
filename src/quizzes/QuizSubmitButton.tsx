interface QuizSubmitButtonProps {
  disabled: boolean,
  onSubmit: () => void,
  submissionsRemaining: number,
}

/**
 * Submit button component for use by quiz controls
 */
function QuizSubmitButton({disabled, onSubmit, submissionsRemaining}: QuizSubmitButtonProps) {
  return submissionsRemaining > 0 ? <button type="button"
      className={`quiz-action-button${submissionsRemaining === 1 ? " danger" : ""}`}
      disabled={disabled}
      onClick={onSubmit}>
    Submit{submissionsRemaining < 4 ? ` (${submissionsRemaining} left!)` : ""}
  </button> : null;
}

export default QuizSubmitButton;
