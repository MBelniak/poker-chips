import React, { useCallback, useEffect } from "react";
import { Button, Text, View } from "react-native";
import { useHostStore } from "@/model/store";
import { useRouter } from "expo-router";

const Lobby = () => {
  const router = useRouter();
  const store = useHostStore();

  const createServer = useCallback(() => {
    store.startServer();
    store.addPlayer({ name: "host", socket: null, isHost: true });
  }, [store]);

  const stopHosting = useCallback(() => {
    store.stopServer();
  }, [store]);

  useEffect(() => {
    return () => {
      stopHosting();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={{ marginBlock: "auto" }}>
      <Text>Game Host</Text>
      {store.server == null ? (
        <Button title="Start Hosting" onPress={createServer} />
      ) : (
        <View>
          <Text>Players: {store.players.length}</Text>
          {store.players.map((player, index) => {
            return <Text key={index}>{player.name}</Text>;
          })}
          <Button
            title="Start game"
            onPress={() => router.navigate("/host/game")}
            disabled={store.players.length < 2}
          />
          <Button title="Stop Hosting" onPress={stopHosting} />
        </View>
      )}
    </View>
  );
};

export default Lobby;
