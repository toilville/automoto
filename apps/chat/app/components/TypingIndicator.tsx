/**
 * TypingIndicator — Three-dot animation shown while the agent is responding.
 */
import { makeStyles, tokens } from "@fluentui/react-components";

const useStyles = makeStyles({
  container: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
    padding: "8px 16px",
  },
  dot: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    backgroundColor: tokens.colorNeutralForeground3,
    animationName: {
      "0%, 80%, 100%": { opacity: 0.3, transform: "scale(0.8)" },
      "40%": { opacity: 1, transform: "scale(1)" },
    },
    animationDuration: "1.4s",
    animationIterationCount: "infinite",
    animationTimingFunction: "ease-in-out",
  },
  dot1: { animationDelay: "0s" },
  dot2: { animationDelay: "0.2s" },
  dot3: { animationDelay: "0.4s" },
  label: {
    marginLeft: "8px",
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
  },
});

interface TypingIndicatorProps {
  label?: string;
}

export function TypingIndicator({ label = "AI is thinking" }: TypingIndicatorProps) {
  const styles = useStyles();

  return (
    <div className={styles.container} role="status" aria-label={label}>
      <div className={`${styles.dot} ${styles.dot1}`} />
      <div className={`${styles.dot} ${styles.dot2}`} />
      <div className={`${styles.dot} ${styles.dot3}`} />
      {label && <span className={styles.label}>{label}</span>}
    </div>
  );
}
