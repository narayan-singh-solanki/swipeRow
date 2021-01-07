import React from "react";
import {
  Text,
  View,
  StyleSheet,
  FlatList,
  LayoutAnimation,
  Platform,
  UIManager,
  TouchableOpacity,
  Dimensions
} from "react-native";

const { width } = Dimensions.get("window");

import { TouchableOpacity as RNGHTouchableOpacity } from "react-native-gesture-handler";
import Animated from "react-native-reanimated";
import SwipeableItem from 'react-native-swipeable-item';
import DraggableFlatList from "react-native-draggable-flatlist";
const { multiply, sub } = Animated;

const isAndroid = Platform.OS === "android";

if (isAndroid && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const PlatformTouchable = isAndroid ? TouchableOpacity : TouchableOpacity;

const NUM_ITEMS = 3;
function getColor(i) {
  const multiplier = 255 / (NUM_ITEMS - 1);
  const colorVal = i * multiplier;
  return `rgb(${colorVal}, ${Math.abs(128 - colorVal)}, ${255 - colorVal})`;
}

const initialData = [...Array(NUM_ITEMS)].fill(0).map((d, index) => ({
  text: `Row ${index}`,
  key: `key-${index}`, // Note: It's bad practice to use index as your key. Don't do it in production!
  backgroundColor: getColor(index),
  hasLeft: index % 3 === 0 || index % 3 === 1,
  hasRight: index % 3 === 0 || index % 3 === 2
}));

class App extends React.Component {
  state = {
    data: initialData
  };

  itemRefs = new Map();

  deleteItem = item => {
    const updatedData = this.state.data.filter(d => d !== item);
    // Animate list to close gap when item is deleted
    LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
    this.setState({ data: updatedData });
  };

  renderUnderlayLeft = ({ item, percentOpen }) => (
    <Animated.View
      style={[styles.row, styles.underlayLeft, { opacity: percentOpen }]} // Fade in on open
    >
      <PlatformTouchable onPressOut={() => this.deleteItem(item.item)}>
        <Text style={styles.text}>{`[x]`}</Text>
      </PlatformTouchable>
    </Animated.View>
  );

  renderUnderlayRight = ({ item, percentOpen, close }) => (
    <Animated.View
      style={[
        styles.row,
        styles.underlayRight,
        {
          transform: [{ translateX: multiply(sub(1, percentOpen), -100) }] // Translate from left on open
        }
      ]}
    >
      <PlatformTouchable onPressOut={close}>
        <Text style={styles.text}>CLOSE</Text>
      </PlatformTouchable>
    </Animated.View>
  );

  renderOverlay = ({ item, openLeft, openRight, openDirection, close }) => {
    const { text, backgroundColor, hasLeft, hasRight } = item.item;
    return (
      <View style={[styles.row, { backgroundColor }]}>
        <View style={[styles.flex, { alignItems: "flex-start" }]}>
          {hasRight && (
            <PlatformTouchable
              onPressOut={!!openDirection ? close : () => openRight(1)}
            >
              <Text style={styles.text}>{`<`}</Text>
            </PlatformTouchable>
          )}
        </View>
        <PlatformTouchable style={styles.flex} onLongPress={item.drag}>
          <Text style={styles.text}>{text}</Text>
        </PlatformTouchable>
        <View style={[styles.flex, { alignItems: "flex-end" }]}>
          {hasLeft && (
            <PlatformTouchable onPressOut={!!openDirection ? close : openLeft}>
              <Text style={styles.text}>{`>`}</Text>
            </PlatformTouchable>
          )}
        </View>
      </View>
    );
  };

  renderItem = ({ item, index, drag }) => {
    return (
      <SwipeableItem
        key={item.key}
        item={{ item, drag }}
        ref={ref => {
          if (ref && !this.itemRefs.get(item.key)) {
            this.itemRefs.set(item.key, ref);
          }
        }}
        onChange={({ open }) => {
          if (open) {
            // Close all other open items
            [...this.itemRefs.entries()].forEach(([key, ref]) => {
              if (key !== item.key && ref) ref.close();
            });
          }
        }}
        overSwipe={50}
        renderUnderlayLeft={this.renderUnderlayLeft}
        snapPointsLeft={item.hasLeft ? [100] : undefined}
        renderUnderlayRight={this.renderUnderlayRight}
        snapPointsRight={item.hasRight ? [100, width] : undefined}
        renderOverlay={this.renderOverlay}
      />
    );
  };

  render() {
    return (
      <View style={styles.container}>
        <DraggableFlatList
          activationDistance={15}
          keyExtractor={item => item.key}
          data={this.state.data}
          renderItem={this.renderItem}
          onDragEnd={({ data }) => this.setState({ data })}
        />
      </View>
    );
  }
}

export default App;

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  flex: {
    flex: 1
  },
  row: {
    flexDirection: "row",
    flex: 1,
    alignItems: "center",
    justifyContent: "space-around",
    padding: 15
  },
  text: {
    fontWeight: "bold",
    color: "white",
    fontSize: 32
  },
  underlayRight: {
    flex: 1,
    backgroundColor: "teal",
    justifyContent: "flex-start"
  },
  underlayLeft: {
    flex: 1,
    backgroundColor: "tomato",
    justifyContent: "flex-end"
  }
});
