import React from "react";
import { Button, View } from "react-native";
import { useRouter } from "expo-router";

const MainPage = () => {
  const router = useRouter();

  return (
    <View style={{ marginBlock: "auto" }}>
      <Button title="Host a game" onPress={() => router.navigate("/host")} />
      <Button
        title="Join a game"
        onPress={() => router.navigate("/join-game")}
      />
    </View>
  );
};

export default MainPage;
