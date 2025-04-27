import React, { useCallback, useEffect, useState } from "react";
import { Button, Text, TextInput, View } from "react-native";
import { getDefaultGameState, useStore } from "@/model/store";
import { useFocusEffect, useRouter } from "expo-router";
import { getClientId } from "@/utils";
import { createGameStateEvent } from "@/model/messageCreators";
import { HOST_PLAYER_ID } from "@/constants/string-constants";

const Lobby = () => {
  const router = useRouter();
  const [hostName, setHostName] = useState("");
  const {
    server,
    status,
    table,
    players,
    buyInAmount,
    actionHistory,
    pendingJoinRequests,
    setGameState,
    setBuyInAmount,
    startServer,
    addPlayer,
    removeAllPlayers,
    sendDisconnectEventToPlayer,
    stopServer,
    removeJoinRequest,
  } = useStore();

  useFocusEffect(
    useCallback(() => {
      return () => {
        Object.keys(pendingJoinRequests).forEach(removeJoinRequest);
      };
    }, [pendingJoinRequests, removeJoinRequest]),
  );

  const createServer = useCallback(() => {
    startServer();
    setGameState(getDefaultGameState(buyInAmount));
    addPlayer({
      id: HOST_PLAYER_ID,
      name: hostName,
      socket: null,
      isHost: true,
    });
  }, [addPlayer, buyInAmount, hostName, setGameState, startServer]);

  const stopHosting = useCallback(() => {
    setBuyInAmount("");
    Object.keys(pendingJoinRequests).forEach(removeJoinRequest);
    players.forEach(sendDisconnectEventToPlayer);
    setGameState({ status: "waiting" });
    removeAllPlayers();
    stopServer();
  }, [
    pendingJoinRequests,
    players,
    removeAllPlayers,
    removeJoinRequest,
    sendDisconnectEventToPlayer,
    setBuyInAmount,
    setGameState,
    stopServer,
  ]);

  useEffect(() => {
    return () => {
      stopHosting();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    players.forEach((player) => {
      player.socket?.write(
        createGameStateEvent({
          status,
          actionHistory,
          table,
        }),
      );
    });
  }, [actionHistory, buyInAmount, players, status, table]);

  const startGame = useCallback(() => {
    setGameState({ status: "playing" });
    router.navigate("/host/game");
  }, [router, setGameState]);

  return (
    <View style={{ marginBlock: "auto" }}>
      <Text>Game Host</Text>
      {server == null ? (
        <View>
          <Text>Buy in amount: </Text>
          <TextInput
            keyboardType={"numeric"}
            onChangeText={(text) => setBuyInAmount(text)}
            value={buyInAmount ? buyInAmount.toString() : ""}
          />
          <Text>Your name: </Text>
          <TextInput
            onChangeText={(text) => setHostName(text)}
            value={hostName}
          />
          <Button
            title="Start Hosting"
            onPress={createServer}
            disabled={buyInAmount === 0 || hostName.trim() === ""}
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
              (player) =>
                !player.isHost && getClientId(player.socket) === playerId,
            );
            return (
              <View key={index} style={{ flexDirection: "row", gap: 2 }}>
                <Text>{player?.name}</Text>
                <Text>{"OTP: " + pendingJoinRequests[playerId].otp}</Text>
              </View>
            );
          })}
          <Button
            title={status === "playing" ? "Continue" : "Start game"}
            onPress={startGame}
            disabled={players.length < 2}
          />
          <Button title="Stop Hosting" onPress={stopHosting} />
        </View>
      )}
    </View>
  );
};

export default Lobby;
