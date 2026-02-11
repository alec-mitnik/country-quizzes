import Button from "../Button";

interface QuizSubmitButtonProps {
  disabled: boolean,
  alreadyGuessed: boolean,
  onSubmit: () => void,
  submissionsRemaining: number,
}

/**
 * Submit button component for use by quiz controls
 * @param {boolean} props.disabled Whether the button should be disabled
 * @param {boolean} props.alreadyGuessed Whether the current answer has already been guessed
 * and thus should communicate this and disable the button
 * @param {function} props.onSubmit Function to call when the button is clicked
 * @param {number} props.submissionsRemaining The number of submissions remaining
 */
function QuizSubmitButton({disabled, alreadyGuessed, onSubmit,
    submissionsRemaining}: QuizSubmitButtonProps) {
  return submissionsRemaining > 0 ? <Button type="button"
      id="quiz-submit-button"
      className={`quiz-action-button${submissionsRemaining === 1 ? " danger" : ""}`}
      disabled={disabled || alreadyGuessed}
      onClick={onSubmit}>
    {alreadyGuessed ? "Already Guessed!"
        : `Submit${submissionsRemaining < 4 ? ` (${submissionsRemaining} left!)` : ""}`}
  </Button> : null;
}

export default QuizSubmitButton;
