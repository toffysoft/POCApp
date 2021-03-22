import React, {createContext, useEffect, useRef, useState} from 'react';
import {PermissionsAndroid, AppState, Platform} from 'react-native';

import {BleManager} from 'react-native-ble-plx';
import _ from 'lodash';
import {encryptText} from '../util';
import Base64 from '../Base64';

const MainContext = createContext();

const restore_state_identifier = 'manager';
const restore_state_function = async restored_state => {
  console.log('Restored State: ', restored_state);
  // const connected_devices = await restored_state.connectedDevices();
  // console.log('Connected Devices: ', connected_devices);
  // do what you need with the devices_connected
};

const DeviceManager = new BleManager({
  restoreStateIdentifier: restore_state_identifier,
  restoreStateFunction: restore_state_function,
});

// const DeviceManager = new BleManager();

//on android device, we should ask permission
const requestLocationPermission = async () => {
  try {
    if (Platform.OS === 'ios') {
      return true;
    }

    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
      {
        title: 'Location permission for bluetooth scanning',
        message: 'wahtever',
        buttonNeutral: 'Ask Me Later',
        buttonNegative: 'Cancel',
        buttonPositive: 'OK',
      },
    );

    const granted2 = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      {
        title: 'Location permission for bluetooth scanning',
        message: 'wahtever',
        buttonNeutral: 'Ask Me Later',
        buttonNegative: 'Cancel',
        buttonPositive: 'OK',
      },
    );

    const granted3 = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_BACKGROUND_LOCATION,
      {
        title: 'Location permission for bluetooth scanning',
        message: 'wahtever',
        buttonNeutral: 'Ask Me Later',
        buttonNegative: 'Cancel',
        buttonPositive: 'OK',
      },
    );

    // READ_CALENDAR: 'android.permission.READ_CALENDAR'
    // WRITE_CALENDAR: 'android.permission.WRITE_CALENDAR'
    // CAMERA: 'android.permission.CAMERA'
    // READ_CONTACTS: 'android.permission.READ_CONTACTS'
    // WRITE_CONTACTS: 'android.permission.WRITE_CONTACTS'
    // GET_ACCOUNTS: 'android.permission.GET_ACCOUNTS'
    // ACCESS_FINE_LOCATION: 'android.permission.ACCESS_FINE_LOCATION'
    // ACCESS_COARSE_LOCATION: 'android.permission.ACCESS_COARSE_LOCATION'
    // ACCESS_BACKGROUND_LOCATION: 'android.permission.ACCESS_BACKGROUND_LOCATION',
    // RECORD_AUDIO: 'android.permission.RECORD_AUDIO'
    // READ_PHONE_STATE: 'android.permission.READ_PHONE_STATE'
    // CALL_PHONE: 'android.permission.CALL_PHONE'
    // READ_CALL_LOG: 'android.permission.READ_CALL_LOG'
    // WRITE_CALL_LOG: 'android.permission.WRITE_CALL_LOG'
    // ADD_VOICEMAIL: 'com.android.voicemail.permission.ADD_VOICEMAIL'
    // USE_SIP: 'android.permission.USE_SIP'
    // PROCESS_OUTGOING_CALLS: 'android.permission.PROCESS_OUTGOING_CALLS'
    // BODY_SENSORS: 'android.permission.BODY_SENSORS'
    // SEND_SMS: 'android.permission.SEND_SMS'
    // RECEIVE_SMS: 'android.permission.RECEIVE_SMS'
    // READ_SMS: 'android.permission.READ_SMS'
    // RECEIVE_WAP_PUSH: 'android.permission.RECEIVE_WAP_PUSH'
    // RECEIVE_MMS: 'android.permission.RECEIVE_MMS'
    // READ_EXTERNAL_STORAGE: 'android.permission.READ_EXTERNAL_STORAGE'
    // WRITE_EXTERNAL_STORAGE: 'android.permission.WRITE_EXTERNAL_STORAGE'

    if (
      granted === PermissionsAndroid.RESULTS.GRANTED &&
      granted2 === PermissionsAndroid.RESULTS.GRANTED &&
      granted3 === PermissionsAndroid.RESULTS.GRANTED
    ) {
      console.log('Location permission for bluetooth scanning granted');
      return true;
    } else {
      console.log('Location permission for bluetooth scanning revoked', {
        granted,
        granted2,
        granted3,
      });
      return false;
    }
  } catch (err) {
    console.warn(err);
    return false;
  }
};

// const service_uuid = '0000ffe0-0000-1000-8000-00805f9b34fb' // default HM service

const service_uuid = '0000a1a1-0000-1000-8000-00805f9b34fb'; // toffysoft custom

let base64packet = Base64.btoa('\n' + "~(' A ')~" + '\n');

function getService(services) {
  const s = _.find(services, o => _.get(o, ['uuid']) === service_uuid);

  return _.get(s, ['uuid']);
}
function getCharacteristics(characteristics) {
  const c = _.find(
    characteristics,
    o =>
      _.get(o, ['serviceUUID']) === service_uuid &&
      _.get(o, ['isWritableWithResponse']) &&
      _.get(o, ['isWritableWithoutResponse']),
  );
  return _.get(c, ['uuid']);
}

const MainContextProvider = ({children}) => {
  const rangeRef = useRef(40);
  const [range, setRange] = useState(rangeRef.current);

  const devicesRef = useRef({});
  const devicesEventIdRef = useRef([]);
  const [devices, setDevices] = useState({});

  const scan = async () => {
    const permission = await requestLocationPermission();

    if (permission) {
      DeviceManager.startDeviceScan(
        [service_uuid],
        // null,
        {allowDuplicates: true},
        async (error, device) => {
          if (error) {
            console.log('BLE_LOG startDeviceScan error', {error});
          }
          if (device !== null && device.name) {
            if (
              !_.get(devicesRef.current, [device.id]) &&
              // _.get(device, 'rssi', 0) > -40
              _.get(device, 'rssi', 0) > -1 * rangeRef.current
            ) {
              // console.log('BLE_LOG device', {device});

              setDevices({[device.id]: device, ...devicesRef.current});

              device
                .connect()
                .then(deviceRes => {
                  // console.log('BLE_LOG 1', {deviceRes});
                  return deviceRes.discoverAllServicesAndCharacteristics();
                })
                .then(async deviceRes => {
                  // console.log('BLE_LOG 2', {deviceRes});
                  let services = await deviceRes.services(device.id);

                  const serviceUUID = getService(services);

                  // console.log('BLE_LOG ServiceUUID', {
                  //   services,
                  //   serviceUUID,
                  // });

                  if (!serviceUUID) {
                    console.log('no service uuid match');
                    return;
                  }

                  let characteristics = await DeviceManager.characteristicsForDevice(
                    device.id,
                    serviceUUID,
                  );

                  const characteristicUUID = getCharacteristics(
                    characteristics,
                  );

                  console.log('BLE_LOG ServiceUUID', {
                    services,
                    serviceUUID,
                  });

                  console.log('BLE_LOG CharacteristicUUID', {
                    characteristics,
                    characteristicUUID,
                  });

                  if (!characteristicUUID) {
                    console.log('no characteristic match');
                    return;
                  }

                  // Do work on device with services and characteristics

                  await device
                    .writeCharacteristicWithoutResponseForService(
                      serviceUUID,
                      characteristicUUID,
                      base64packet,
                    )
                    .then(Characteristic => {
                      console.log(
                        'BLE_LOG writeCharacteristicWithoutResponseForService',
                        // {
                        //   services: services[2].uuid,
                        //   characteristics: characteristics[0].uuid,
                        // },
                        {Characteristic},
                      );
                    })
                    .catch(error => {
                      // Handle errors

                      console.log(
                        'BLE_LOG writeCharacteristicWithoutResponseForService',
                        // {
                        //   services: services[2].uuid,
                        //   characteristics: characteristics[0].uuid,
                        // },
                        {error},
                      );
                    });
                })
                .catch(error => {
                  // Handle errors

                  console.log('BLE_LOG device connect error', {error});
                });

              if (!_.includes(devicesEventIdRef.current, device.id)) {
                device.onDisconnected((err, thisDevice) => {
                  if (err) {
                    console.log('BLE_LOG onDisconnected error', err);
                  }

                  // console.log('BLE_LOG onDisconnected', thisDevice);

                  setDevices(_.omit(devicesRef.current, [thisDevice.id]));
                  scan();
                  // thisDevice.remove();
                });

                devicesEventIdRef.current.push(device.id);

                DeviceManager.stopDeviceScan();
              }
            }
          }
        },
      );

      DeviceManager.onStateChange(state => {
        console.log({state});
        // if (state === 'PoweredOn') {
        // this.scanAndConnect();
        // subscription.remove();
        // }
      }, true);
    } else {
      //TODO: here we could treat any new state or new thing when there's no permission to BLE
      console.log('Error no permission to BLE');
    }

    // setTimeout(() => {
    //   DeviceManager.stopDeviceScan();
    //   console.log('DeviceManager.stopDeviceScan();');
    // }, 4000);
  };

  useEffect(() => {
    requestLocationPermission();
    scan();

    AppState.addEventListener('change', appState => {
      console.log('addEventListener change => ', {appState});
    });

    return () => {
      AppState.removeEventListener('change', appState => {
        console.log('removeEventListener => ', {appState});
      });
    };
  }, []);

  useEffect(() => {
    devicesRef.current = devices;
  }, [devices]);

  useEffect(() => {
    rangeRef.current = range;
  }, [range]);

  return (
    <MainContext.Provider value={{scan, devices, range, setRange}}>
      {children}
    </MainContext.Provider>
  );
};

export {MainContext, MainContextProvider};
