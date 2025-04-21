import React, { useCallback, useEffect } from "react";
import { Button, Text, TextInput, View } from "react-native";
import { useStore } from "@/model/store";
import { useRouter } from "expo-router";

const Lobby = () => {
  const router = useRouter();
  const {
    server,
    players,
    buyInAmount,
    pendingJoinRequests,
    setBuyInAmount,
    startServer,
    addPlayer,
    removePlayer,
    stopServer,
  } = useStore();

  const createServer = useCallback(() => {
    startServer();
    addPlayer({ name: "host", socket: null, isHost: true });
  }, [addPlayer, startServer]);

  const stopHosting = useCallback(() => {
    players.forEach(removePlayer);
    stopServer();
  }, [players, removePlayer, stopServer]);

  useEffect(() => {
    return () => {
      stopHosting();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={{ marginBlock: "auto" }}>
      <Text>Game Host</Text>
      {server == null ? (
        <View>
          <Text>Buy in amount: </Text>
          <TextInput
            keyboardType={"numeric"}
            onChangeText={(text) => setBuyInAmount(text)}
          />
          <Button
            title="Start Hosting"
            onPress={createServer}
            disabled={buyInAmount === 0}
          />
        </View>
      ) : (
        <View>
          <Text>Players count: {players.length}</Text>
          {players
            .filter((player) => !player.isHost)
            .map((player, index) => {
              return (
                <View key={index} style={{ flexDirection: "row", gap: 2 }}>
                  <Text>{player.name}</Text>
                </View>
              );
            })}
          {Object.keys(pendingJoinRequests).map((playerId, index) => {
            const player = players.find(
              (player) => player.socket?._id.toString() === playerId,
            );
            return (
              <View key={index} style={{ flexDirection: "row", gap: 2 }}>
                <Text>{player?.name}</Text>
                <Text>{"OTP: " + pendingJoinRequests[playerId].otp}</Text>
              </View>
            );
          })}
          <Button
            title="Start game"
            onPress={() => router.navigate("/host/game")}
            disabled={players.length < 2}
          />
          <Button title="Stop Hosting" onPress={stopHosting} />
        </View>
      )}
    </View>
  );
};

export default Lobby;
