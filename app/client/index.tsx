import React, { useCallback, useEffect, useState } from "react";
import { Button, Text, TextInput, View } from "react-native";
import { useStore } from "@/model/store";
import {
  OTP_LENGTH,
  SERVICE_DOMAIN,
  SERVICE_PROTOCOL,
  SERVICE_TYPE,
} from "@/constants/Connection";
import { AvailableGame } from "@/model/types";
import { createOtpResponseEvent } from "@/model/messageCreators";
import { useRouter } from "expo-router";

const JoinGame = () => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpSubmitted, setOtpSubmitted] = useState(false);
  const router = useRouter();

  const {
    clientTcpService,
    clientSocket,
    connectToGame,
    isWaitingForOtp,
    availableGames,
    addAvailableGame,
    clientName,
    setClientName,
    isInvalidOtp,
    isJoined,
  } = useStore();
  useEffect(() => {
    clientTcpService.on("resolved", (service) => {
      console.log("Found game:", service.name);
      addAvailableGame({
        host: service.host,
        name: service.name,
        port: service.port,
      });
    });

    clientTcpService.scan(SERVICE_TYPE, SERVICE_PROTOCOL, SERVICE_DOMAIN);

    clientTcpService.on("error", (error) => {
      // TODO handle error
      console.log("Error:", error);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const joinGame = useCallback(
    (game: AvailableGame) => {
      setIsConnecting(true);
      connectToGame(game).finally(() => setIsConnecting(false));
    },
    [connectToGame],
  );

  const submitOtp = useCallback(() => {
    clientSocket?.write(createOtpResponseEvent(otp));
    setOtpSubmitted(true);
  }, [clientSocket, otp]);

  useEffect(() => {
    if (isJoined) {
      router.navigate("/client/game");
    } else if (isInvalidOtp) {
      setOtpSubmitted(false);
    }
  }, [isInvalidOtp, isJoined, router]);

  return (
    <View style={{ marginBlock: "auto" }}>
      {isConnecting && <Text>{"Connecting..."}</Text>}
      {!isConnecting &&
        (isWaitingForOtp ? (
          <View>
            <Text>{"Type OTP displayed on host"}</Text>
            <TextInput
              maxLength={OTP_LENGTH}
              keyboardType={"numeric"}
              onChangeText={setOtp}
              value={otp}
            />
            <Button
              title={"Submit"}
              disabled={otp.length < 6 || otpSubmitted}
              onPress={() => submitOtp()}
            />
            {otpSubmitted && (
              <Text>{"Waiting for server to let us in..."}</Text>
            )}
            {isInvalidOtp && <Text>{"Invalid otp, please try again"}</Text>}
          </View>
        ) : (
          <View>
            <Text>{"Type your name to connect to the game"}</Text>
            <TextInput onChangeText={setClientName} />
            <Text>{"Scanning for games..."}</Text>
            <Text>{"Available games: "}</Text>
            {availableGames.map((game) => {
              return (
                <View key={game.host} style={{ flexDirection: "row" }}>
                  <Text>{game.name}</Text>
                  <Button
                    onPress={() => joinGame(game)}
                    title={"Join game"}
                    disabled={clientName.trim().length === 0}
                  />
                </View>
              );
            })}
          </View>
        ))}
    </View>
  );
};

export default JoinGame;
