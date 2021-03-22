import React, {useContext, useEffect} from 'react';
import {Text, View} from 'react-native';
import {MainContext} from '../context/mainContext';
import _ from 'lodash';
import {ScrollView} from 'react-native';

import Slider from '@react-native-community/slider';

export default () => {
  const {devices, range, setRange} = useContext(MainContext);
  // const list = Array.from(devices.values());
  // console.log({devices: devices, range});

  const onValueChange = val => {
    setRange(val);
  };

  return (
    <View style={{paddingLeft: 20, paddingRight: 20, paddingTop: 100}}>
      <View style={{paddingBottom: 30, alignItems: 'center'}}>
        <Text style={{fontSize: 20}}>{`-${range}`}</Text>
      </View>
      <Slider
        value={range}
        style={{width: '100%', height: 40}}
        minimumValue={30}
        maximumValue={100}
        minimumTrackTintColor="#ccc"
        maximumTrackTintColor="#000000"
        onValueChange={onValueChange}
        step={1}
      />
      <ScrollView>
        {_.map(devices, device => {
          return (
            <View style={{paddingBottom: 20}}>
              {/* <Text>{device.id}</Text> */}
              <Text>{device.name}</Text>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
};
