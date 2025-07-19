import React from "react";
import { BettingPhase } from "@/model/store/slices/tableSlice";
import { useStore } from "@/model/store";
import { useShallow } from "zustand/react/shallow";
import { Text } from "react-native";

export const CurrentPhaseText: React.FC = () => {
  const { currentPhase } = useStore(
    useShallow((state) => ({
      currentPhase: state.table.currentPhase,
    })),
  );

  let currentPhaseText;
  switch (currentPhase) {
    case BettingPhase.TURN:
      currentPhaseText = "turn";
      break;
    case BettingPhase.FLOP:
      currentPhaseText = "flop";
      break;
    case BettingPhase.PRE_FLOP:
      currentPhaseText = "pre-flop";
      break;
    case BettingPhase.RIVER:
      currentPhaseText = "river";
      break;
    default:
      currentPhaseText = "";
  }

  return (
    <Text>
      {!currentPhase
        ? "Waiting for next round to start..."
        : `Current phase: ${currentPhaseText}`}
    </Text>
  );
};
