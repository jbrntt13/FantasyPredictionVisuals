import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  LayoutChangeEvent,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Matchup } from "../api/odds";
import { NeedleGauge } from "../components/Speedometer";

type Props = {
  matchup: Matchup;
  isLive?: boolean;
  currentScores?: Record<string, number>;
  projScores?: Record<string, number>;
};

const formatPercent = (value: number) => `${(value * 100).toFixed(1)}%`;

export default function MatchupCard({
  matchup,
  isLive = false,
  currentScores,
  projScores,
}: Props) {
  const [cardWidth, setCardWidth] = useState(0);
  const livePulse = useRef(new Animated.Value(0)).current;
  const initialScoresRef = useRef<{
    home: number;
    away: number;
  } | undefined>(undefined);
  const initialWinProbRef = useRef<{
    home: number;
    away: number;
  } | undefined>(undefined);

  const handleLayout = (event: LayoutChangeEvent) => {
    const width = Math.round(event.nativeEvent.layout.width);
    if (width !== cardWidth) {
      setCardWidth(width);
    }
  };

  const isResolved =
    matchup.home_win_prob >= 0.999 || matchup.away_win_prob >= 0.999;
  const showLiveIndicator = isLive && !isResolved;

  const baseHomeScore =
    projScores?.[matchup.home_team] ?? matchup.home_avg ?? 0;
  const baseAwayScore =
    projScores?.[matchup.away_team] ?? matchup.away_avg ?? 0;

  // default to 50/50 if missing
  const baseHomeProb =
    typeof matchup.home_win_prob === "number" ? matchup.home_win_prob : 0.5;
  const baseAwayProb =
    typeof matchup.away_win_prob === "number" ? matchup.away_win_prob : 0.5;

  if (!initialScoresRef.current) {
    initialScoresRef.current = {
      home: baseHomeScore,
      away: baseAwayScore,
    };
  }

  if (!initialWinProbRef.current) {
    initialWinProbRef.current = {
      home: baseHomeProb,
      away: baseAwayProb,
    };
  }

  const awayCurrentScore =
    isLive && currentScores?.[matchup.away_team] != null
      ? currentScores[matchup.away_team]
      : initialScoresRef.current.away;
  const homeCurrentScore =
    isLive && currentScores?.[matchup.home_team] != null
      ? currentScores[matchup.home_team]
      : initialScoresRef.current.home;

  const awayScoreDelta =
    isLive ? awayCurrentScore - initialScoresRef.current.away : null;
  const homeScoreDelta =
    isLive ? homeCurrentScore - initialScoresRef.current.home : null;

  const awayWinProbDelta = isLive
    ? matchup.away_win_prob - initialWinProbRef.current.away
    : null;
  const homeWinProbDelta = isLive
    ? matchup.home_win_prob - initialWinProbRef.current.home
    : null;

  const formatDelta = (value: number | null | undefined, digits = 1) => {
    if (value == null) return "";
    const display = value >= 0 ? `+${value.toFixed(digits)}` : value.toFixed(digits);
    return ` (${display})`;
  };

  useEffect(() => {
    if (!showLiveIndicator) {
      livePulse.setValue(0);
      return;
    }

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(livePulse, {
          toValue: 1,
          duration: 700,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(livePulse, {
          toValue: 0.2,
          duration: 700,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.delay(1200),
      ]),
    );

    loop.start();

    return () => {
      loop.stop();
    };
  }, [livePulse, showLiveIndicator]);

  // Fill most of the padded area; cap to avoid overflow on larger screens.
  const contentWidth = cardWidth - 24; // padding: 12 left + 12 right
  const gaugeSize =
    contentWidth > 0 ? Math.min(400, contentWidth) : undefined;

  return (
    <View style={styles.card} onLayout={handleLayout}>
      <View style={styles.titleRow}>
        <View style={styles.teamWithLive}>
          {showLiveIndicator && (
            <Animated.View style={[styles.liveDot, { opacity: livePulse }]} />
          )}
          <View>
            <Text style={styles.teamName}>{matchup.away_team}</Text>
            {isLive && currentScores?.[matchup.away_team] != null && (
              <Text style={styles.scoreText}>{currentScores[matchup.away_team]}</Text>
            )}
          </View>
        </View>
        <View style={styles.teamWithScore}>
          <Text style={styles.teamName}>{matchup.home_team}</Text>
          {isLive && currentScores?.[matchup.home_team] != null && (
            <Text style={[styles.scoreText, styles.scoreRight]}>
              {currentScores[matchup.home_team]}
            </Text>
          )}
        </View>
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
          <Text style={styles.label}>Projected Score</Text>
          <Text style={styles.avgValue}>
            {awayCurrentScore.toFixed(1)}
            <Text style={styles.deltaText}>{formatDelta(awayScoreDelta)}</Text>
          </Text>
        </View>
        <View style={styles.avgBlockRight}>
          <Text style={[styles.label, styles.labelRight]}>Projected Score</Text>
          <Text style={[styles.avgValue, styles.avgValueRight]}>
            {homeCurrentScore.toFixed(1)}
            <Text style={styles.deltaText}>{formatDelta(homeScoreDelta)}</Text>
          </Text>
        </View>
      </View>

      <View style={styles.avgRow}>
        <View style={styles.avgBlockLeft}>
          <Text style={styles.label}>Win %</Text>
          <Text style={styles.avgValue}>
            {formatPercent(matchup.away_win_prob)}
            <Text style={styles.deltaText}>
              {formatDelta(
                awayWinProbDelta != null ? awayWinProbDelta * 100 : null,
                1,
              )}
            </Text>
          </Text>
        </View>
        <View style={styles.avgBlockRight}>
          <Text style={[styles.label, styles.labelRight]}>Win %</Text>
          <Text style={[styles.avgValue, styles.avgValueRight]}>
            {formatPercent(matchup.home_win_prob)}
            <Text style={styles.deltaText}>
              {formatDelta(
                homeWinProbDelta != null ? homeWinProbDelta * 100 : null,
                1,
              )}
            </Text>
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
  teamWithLive: {
    flexDirection: "row",
    alignItems: "center",
  },
  teamWithScore: {
    alignItems: "flex-end",
  },
  liveDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#ef4444",
    marginRight: 6,
  },
  teamName: {
    color: "#e5e7eb",
    fontSize: 18,
    fontWeight: "700",
  },
  scoreText: {
    color: "#f97316",
    fontSize: 14,
    fontWeight: "700",
    marginTop: 2,
  },
  scoreRight: {
    textAlign: "right",
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
  deltaText: {
    color: "#fbbf24",
    fontSize: 13,
    fontWeight: "700",
  },
});
