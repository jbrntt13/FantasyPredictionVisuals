import { useEffect, useMemo, useState } from "react";
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import MatchupCard from "../components/MatchupCard";
import { Matchup, OddsResponse, getTodayOdds } from "../api/odds";

type Props = {
  onSelectMatchup?: (matchup: Matchup, date: string) => void;
};

const getCurrentWeekLabel = () => {
  const today = new Date();
  const day = today.getDay(); // 0 = Sun, 1 = Mon, ...
  const diffToMonday = (day + 6) % 7; // how many days since Monday
  const monday = new Date(today);
  monday.setDate(today.getDate() - diffToMonday);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const fmt = (date: Date) =>
    date.toLocaleDateString("en-US", { month: "2-digit", day: "2-digit" });

  return `Weekly Matchup of ${fmt(monday)}-${fmt(sunday)}`;
};

export default function OddsScreen({ onSelectMatchup }: Props) {
  const [data, setData] = useState<OddsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const weekLabel = useMemo(() => getCurrentWeekLabel(), []);

  useEffect(() => {
    let isMounted = true;
    let intervalId: ReturnType<typeof setInterval> | null = null;

    const fetchOdds = async (showLoader = true) => {
      try {
        if (showLoader) {
          setLoading(true);
        }
        const response = await getTodayOdds();
        if (!isMounted) return;
        setData(response);
        setError(null);
      } catch (err) {
        if (!isMounted) return;
        setError(err instanceof Error ? err.message : "Failed to fetch odds");
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchOdds();
    intervalId = setInterval(() => {
      fetchOdds(false); // background refresh without UI flicker
    }, 15 * 1000);

    return () => {
      isMounted = false;
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>{weekLabel}</Text>

      {loading && <Text style={styles.status}>Loading…</Text>}

      {!loading && error && (
        <Text style={[styles.status, styles.error]}>
          Error loading odds: {error}
        </Text>
      )}

      {!loading && data && (
        <>
          <Text style={styles.dateLabel}>{data.date}</Text>
          <FlatList
            data={data.matchups}
            keyExtractor={(item, index) =>
              `${item.home_team}-${item.away_team}-${index}`
            }
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.cardWrapper}
                activeOpacity={0.8}
                onPress={() => onSelectMatchup?.(item, data.date)}
              >
                <MatchupCard
                  matchup={item}
                  isLive={data.is_live}
                  currentScores={data.current_scores}
                  projScores={data.proj_scores}
                  winProbs={data.win_probs}
                />
              </TouchableOpacity>
            )}
            contentContainerStyle={styles.listContent}
            columnWrapperStyle={styles.columnWrapper}
            numColumns={2}
            showsVerticalScrollIndicator={false}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#020617",
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  heading: {
    color: "#f8fafc",
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 8,
    textAlign: "center",
  },
  status: {
    color: "#cbd5e1",
    fontSize: 16,
    marginTop: 12,
  },
  error: {
    color: "#fca5a5",
  },
  dateLabel: {
    color: "#94a3b8",
    fontSize: 14,
    marginBottom: 12,
  },
  listContent: {
    paddingBottom: 24,
  },
  columnWrapper: {
    justifyContent: "space-between",
  },
  cardWrapper: {
    flex: 1,
    paddingHorizontal: 6,
    paddingBottom: 12,
  },
});
