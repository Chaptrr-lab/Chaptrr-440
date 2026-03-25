import React from "react";
import { View, Text, StyleSheet, ImageBackground } from "react-native";

interface ShoutBubbleProps {
  children: string;
  color?: string;
  backgroundColor?: string;
  stroke?: string;
  fill?: string;
}

const BUBBLE_IMAGE = "https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/trcvzvxhnrko20fewy3we";

const CAP_INSETS = {
  top: 40,
  left: 40,
  bottom: 40,
  right: 40,
};

export default function ShoutBubble({
  children,
  color = "#FFF",
  backgroundColor,
  stroke,
  fill,
}: ShoutBubbleProps) {
  const [textLayout, setTextLayout] = React.useState({ width: 0, height: 0 });

  const paddingH = 32;
  const paddingV = 20;
  const minWidth = 180;
  const minHeight = 70;

  const bubbleWidth = Math.max(minWidth, textLayout.width + paddingH * 2);
  const bubbleHeight = Math.max(minHeight, textLayout.height + paddingV * 2);

  const bgColor = backgroundColor || fill || "#000";

  return (
    <View style={styles.container}>
      <ImageBackground
        source={{ uri: BUBBLE_IMAGE }}
        resizeMode="stretch"
        capInsets={CAP_INSETS}
        style={[
          styles.bubble,
          {
            width: bubbleWidth,
            height: bubbleHeight,
          },
        ]}
        imageStyle={bgColor !== "#000" ? { tintColor: bgColor } : undefined}
      >
        <View
          style={[
            styles.textContainer,
            {
              paddingHorizontal: paddingH,
              paddingVertical: paddingV,
            },
          ]}
        >
          <Text
            style={[styles.text, { color }]}
            allowFontScaling={false}
            onLayout={(e) => {
              setTextLayout({
                width: e.nativeEvent.layout.width,
                height: e.nativeEvent.layout.height,
              });
            }}
          >
            {children}
          </Text>
        </View>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: "center",
    marginVertical: 8,
  },
  bubble: {
    justifyContent: "center",
    alignItems: "center",
  },
  textContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  text: {
    fontWeight: "800" as const,
    fontSize: 16,
    textAlign: "center",
    lineHeight: 20,
  },
});
