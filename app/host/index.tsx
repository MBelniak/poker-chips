import React, { useCallback, useEffect, useState } from "react";
import { Button, Text, TextInput, View } from "react-native";
import { useStore } from "@/model/store";
import { useFocusEffect, useRouter } from "expo-router";
import { getClientId } from "@/utils";
import { createTableStateMessage } from "@/model/messageCreators";
import { HOST_PLAYER_ID } from "@/constants/string-constants";

const Lobby = () => {
  const router = useRouter();
  const [hostName, setHostName] = useState("");
  const {
    server,
    table,
    players,
    pendingJoinRequests,
    setBuyIn,
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
    addPlayer({
      id: HOST_PLAYER_ID,
      name: hostName,
      socket: null,
      isHost: true,
    });
  }, [addPlayer, hostName, startServer]);

  const stopHosting = useCallback(() => {
    setBuyIn("");
    Object.keys(pendingJoinRequests).forEach(removeJoinRequest);
    players.forEach(sendDisconnectEventToPlayer);
    removeAllPlayers();
    stopServer();
  }, [
    pendingJoinRequests,
    players,
    removeAllPlayers,
    removeJoinRequest,
    sendDisconnectEventToPlayer,
    setBuyIn,
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
      player.socket?.write(createTableStateMessage(table));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [players]);

  const startGame = useCallback(() => {
    router.navigate("/host/game");
  }, [router]);

  return (
    <View style={{ marginBlock: "auto" }}>
      <Text>Game Host</Text>
      {server == null ? (
        <View>
          <Text>Buy in amount: </Text>
          <TextInput
            keyboardType={"numeric"}
            onChangeText={(text) => setBuyIn(text)}
            value={table.buyIn ? table.buyIn.toString() : ""}
          />
          <Text>Your name: </Text>
          <TextInput
            onChangeText={(text) => setHostName(text)}
            value={hostName}
          />
          <Button
            title="Start Hosting"
            onPress={createServer}
            disabled={table.buyIn === 0 || hostName.trim() === ""}
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
