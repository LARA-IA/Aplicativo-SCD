/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, { useEffect, useState } from 'react';
import type {PropsWithChildren} from 'react';
import {
  Image,
  PermissionsAndroid,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from 'react-native';
import { loadTensorflowModel, useTensorflowModel } from 'react-native-fast-tflite';

import {
  Colors,
  DebugInstructions,
  Header,
  LearnMoreLinks,
  ReloadInstructions,
} from 'react-native/Libraries/NewAppScreen';

type SectionProps = PropsWithChildren<{
  title: string;
}>;

function Section({children, title}: SectionProps): React.JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';
  return (
    <View style={styles.sectionContainer}>
      <Text
        style={[
          styles.sectionTitle,
          {
            color: isDarkMode ? Colors.white : Colors.black,
          },
        ]}>
        {title}
      </Text>
      <Text
        style={[
          styles.sectionDescription,
          {
            color: isDarkMode ? Colors.light : Colors.dark,
          },
        ]}>
        {children}
      </Text>
    </View>
  );
}

import { Camera, useCameraDevice, useCameraFormat, useCameraPermission, useFrameProcessor } from 'react-native-vision-camera';
import { useResizePlugin } from 'vision-camera-resize-plugin';

function App(): React.JSX.Element {
  const [permission,setPermission] = useState(false);
  const requestCameraPermission = async () => {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.CAMERA,
        {
          title: 'Cool Photo App Camera Permission',
          message:
            'Cool Photo App needs access to your camera ' +
            'so you can take awesome pictures.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        },
      );
      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        console.log('You can use the camera');
        setPermission(true);
      } else {
        console.log('Camera permission denied');
      }
    } catch (err) {
      console.warn(err);
    }
  };

  useEffect(()=>{
    async function request() {
      await requestCameraPermission();
    }
    request();
  },[])



  let m = useTensorflowModel(require("./assets/skin_cancer_best_model.tflite"));
  const model =  m.state === "loaded" ? m.model : null
  const device: any  = useCameraDevice("back");
  const {resize} = useResizePlugin();
  

  const frameProcessor = useFrameProcessor((frame) => {
    'worklet'
    
   let resized = resize(frame, {
      scale: {
        width: 224,
        height: 224,
      },
      pixelFormat: 'rgb',
      dataType: 'float32',
    });  
    
    
    try{
      const outputs = model?.runSync([resized])
      console.log(outputs);
    }catch(e){
      console.log(e);
    }
    

  },[model]);


  return (
    <View>
      <Text>PREDICT: PLACEHOLDER</Text>
      {permission ? <Camera  frameProcessor={frameProcessor}  style={[styles.camera,StyleSheet.absoluteFill]} device={device} isActive={true}/> : <Text>forneça</Text>}  

      
    </View>
  );
}

const styles = StyleSheet.create({
  camera: {
    marginTop:50,
    height: 400
  },
  sectionContainer: {
    marginTop: 32,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '600',
  },
  sectionDescription: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: '400',
  },
  highlight: {
    fontWeight: '700',
  },
});

export default App;
