import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, G } from 'react-native-svg';

type Props = {
  children: string;
  width?: number;
  height?: number;
  stroke?: string;
  fill?: string;
};

export default function ShoutBubble({ 
  children, 
  width = 320, 
  height = 180,
  stroke = '#f59e0b',
  fill = '#f59e0b'
}: Props) {
  const spikyPath = `
    M 84 96
    C 224 82, 416 82, 556 96
    Q 586 88, 578 108
    Q 610 118, 592 138
    C 600 172, 600 188, 592 244
    Q 610 262, 578 272
    Q 586 292, 556 284
    C 416 298, 224 298, 84 284
    Q 54 292, 62 272
    Q 30 262, 48 244
    C 40 188, 40 172, 48 136
    Q 30 118, 62 108
    Q 54 88, 84 96
    Z
  `;

  return (
    <View style={[styles.container, { width, height }]}>
      <Svg 
        width={width} 
        height={height} 
        viewBox="0 0 736 456" 
        style={styles.svg}
        preserveAspectRatio="xMidYMid meet"
      >
        <G transform="translate(48,48)">
          <Path 
            d={spikyPath}
            fill={fill}
            stroke={stroke}
            strokeWidth={3}
          />
        </G>
      </Svg>
      <View style={styles.textContainer}>
        <Text 
          style={styles.text}
          allowFontScaling={false}
        >
          {children}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    alignSelf: 'center',
  },
  svg: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  textContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 70,
    paddingVertical: 50,
  },
  text: {
    fontSize: 18,
    fontWeight: '800' as const,
    textAlign: 'center',
    lineHeight: 22.5,
    color: '#ffffff',
  },
});