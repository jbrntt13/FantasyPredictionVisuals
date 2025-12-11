import { useState } from "react";
import { LayoutChangeEvent, StyleSheet, Text, View } from "react-native";
import { Matchup } from "../api/odds";
import { NeedleGauge } from "../components/Speedometer";

type Props = {
  matchup: Matchup;
};

const formatPercent = (value: number) => `${(value * 100).toFixed(1)}%`;

export default function MatchupCard({ matchup }: Props) {
  const [cardWidth, setCardWidth] = useState(0);

  const handleLayout = (event: LayoutChangeEvent) => {
    const width = Math.round(event.nativeEvent.layout.width);
    if (width !== cardWidth) {
      setCardWidth(width);
    }
  };

  // Fill most of the padded area; cap to avoid overflow on larger screens.
  const contentWidth = cardWidth - 24; // padding: 12 left + 12 right
  const gaugeSize =
    contentWidth > 0 ? Math.min(400, contentWidth) : undefined;

  return (
    <View style={styles.card} onLayout={handleLayout}>
      <View style={styles.titleRow}>
        <Text style={styles.teamName}>{matchup.away_team}</Text>
        <Text style={styles.teamName}>{matchup.home_team}</Text>
      </View>      
      <NeedleGauge
        size={gaugeSize}
        value={matchup.home_win_prob}
        leftLabel={matchup.away_team}
        rightLabel={matchup.home_team}
        leftImageUrl={matchup.away_team_url}
        rightImageUrl={matchup.home_team_url}
      />
      <View style={styles.avgRow}>
        <View style={styles.avgBlockLeft}>
          <Text style={styles.label}>Avg Score</Text>
          <Text style={styles.avgValue}>{matchup.away_avg.toFixed(1)}</Text>
        </View>
        <View style={styles.avgBlockRight}>
          <Text style={[styles.label, styles.labelRight]}>Avg Score</Text>
          <Text style={[styles.avgValue, styles.avgValueRight]}>
            {matchup.home_avg.toFixed(1)}
          </Text>
        </View>
      </View>

      {matchup.tie_prob > 0 && (
        <Text style={styles.subtext}>
          Tie chance: {formatPercent(matchup.tie_prob)}
        </Text>
      )}

      <Text style={styles.subtext}>
        Simulated {matchup.trials.toLocaleString()} trials
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 0,
    backgroundColor: "#0b1224",
    borderColor: "#1f2937",
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 0,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  label: {
    color: "#9ca3af",
    fontSize: 14,
  },
  labelRight: {
    textAlign: "right",
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  teamName: {
    color: "#e5e7eb",
    fontSize: 18,
    fontWeight: "700",
  },
  value: {
    color: "#f3f4f6",
    fontSize: 15,
    fontWeight: "600",
  },
  subtext: {
    color: "#9ca3af",
    fontSize: 13,
  },
  avgRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
    marginTop: 4,
  },
  avgBlockLeft: {
    alignItems: "flex-start",
  },
  avgBlockRight: {
    alignItems: "flex-end",
  },
  avgValue: {
    color: "#f3f4f6",
    fontSize: 16,
    fontWeight: "700",
  },
  avgValueRight: {
    textAlign: "right",
  },
});
