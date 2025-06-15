import React, { Fragment, useCallback, useState } from "react";
import { Button, Text, View } from "react-native";
import { useStore } from "@/model/store";
import { useShallow } from "zustand/react/shallow";
import Checkbox from "react-native-bouncy-checkbox";
import { TablePlayer } from "@/model/store/slices/playerSlice";

export const ShowdownPrompt: React.FC = () => {
  const [selectedPlayers, setSelectedPlayers] = useState<TablePlayer[]>([]);

  const { distributePotToWinners } = useStore();

  const { pots, players } = useStore(
    useShallow((state) => ({
      pots: state.table.pots,
      players: state.table.players,
    })),
  );

  const onConfirm = useCallback(() => {
    distributePotToWinners(pots[0], selectedPlayers);
  }, [distributePotToWinners, pots, selectedPlayers]);

  return pots.length > 0 ? (
    <View>
      <Text>Pot value: {pots[0].amount}</Text>
      <Text>Who won this pot?</Text>
      {pots[0].eligiblePlayersIds
        .map(
          (playerId) =>
            players.find((player) => player?.id === playerId) as TablePlayer,
        )
        .map((player) => (
          <Fragment key={player.id}>
            <Checkbox
              isChecked={selectedPlayers.includes(player)}
              onPress={(isChecked: boolean) => {
                if (isChecked) {
                  setSelectedPlayers([...selectedPlayers, player]);
                } else {
                  setSelectedPlayers(
                    selectedPlayers.filter((p) => p.id !== player.id),
                  );
                }
              }}
            />
            <Text>{player.name}</Text>
          </Fragment>
        ))}
      <Button title={"Confirm"} onPress={onConfirm} />
    </View>
  ) : null;
};
