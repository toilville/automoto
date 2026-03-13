/**
 * ChatWelcome — Welcome screen with action cards shown before first message.
 */
import {
  makeStyles,
  tokens,
  Card,
  CardHeader,
  Text,
} from "@fluentui/react-components";
import type { WelcomeCard } from "~/models/types";

const useStyles = makeStyles({
  container: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "48px 24px",
    gap: "24px",
    flexGrow: 1,
  },
  title: {
    fontSize: tokens.fontSizeBase600,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
    textAlign: "center" as const,
  },
  subtitle: {
    fontSize: tokens.fontSizeBase300,
    color: tokens.colorNeutralForeground2,
    textAlign: "center" as const,
    maxWidth: "500px",
  },
  cards: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "12px",
    width: "100%",
    maxWidth: "600px",
  },
  card: {
    cursor: "pointer",
    transition: "box-shadow 0.2s ease",
    ":hover": {
      boxShadow: tokens.shadow8,
    },
  },
  cardIcon: {
    fontSize: "24px",
    marginRight: "8px",
  },
});

interface ChatWelcomeProps {
  title?: string;
  subtitle?: string;
  cards?: WelcomeCard[];
  onAction: (payload: string) => void;
}

export function ChatWelcome({
  title = "Explore Automoto",
  subtitle = "Discover focus areas, find people, browse publications, and stay up to date with the latest from Automoto.",
  cards = [],
  onAction,
}: ChatWelcomeProps) {
  const styles = useStyles();

  return (
    <div className={styles.container}>
      <Text className={styles.title}>{title}</Text>
      <Text className={styles.subtitle}>{subtitle}</Text>
      {cards.length > 0 && (
        <div className={styles.cards}>
          {cards
            .sort((a, b) => a.order - b.order)
            .map((card) => (
              <Card
                key={card.id}
                className={styles.card}
                onClick={() => onAction(card.action.payload)}
                role="button"
                aria-label={card.title}
              >
                <CardHeader
                  header={
                    <Text weight="semibold">
                      <span className={styles.cardIcon}>{card.icon}</span>
                      {card.title}
                    </Text>
                  }
                  description={
                    <Text size={200} style={{ color: tokens.colorNeutralForeground2 }}>
                      {card.description}
                    </Text>
                  }
                />
              </Card>
            ))}
        </div>
      )}
    </div>
  );
}
