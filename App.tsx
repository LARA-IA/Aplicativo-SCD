import React, { useEffect, useState } from 'react';
import {
  Button,
  PermissionsAndroid,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useTensorflowModel } from 'react-native-fast-tflite';


import { Camera, useCameraDevice, useFrameProcessor } from 'react-native-vision-camera';
import { useRunOnJS } from 'react-native-worklets-core';
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
  let [out,setOuta] = useState({label:"scanning",prob:1});

  const handleResultado = useRunOnJS((resultado) => {
    setOuta(resultado);
    
  },[]);
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
    
    const lables = ["Bowen's disease"," Basal cell carcinoma","benign keratosis-like lesion", "dermatofibroma","melanoma","melanocytic nevi","vascular lesion"]
    try{
      const outputs = model?.runSync([resized])
      //console.log(outputs)
      let biggestProb : any= -1;
      let number: any = 0;
      let values = outputs?.at(0);
      let label : string = "";
      for(let index=0;index<=6;index++){
        number = values?.at(index);
        if(number > biggestProb){
          biggestProb = number;
          label = lables[index];
        }
      }
      let results = {prob: biggestProb,label:[label]}
      handleResultado(results);
      
    }catch(e){
      console.log(e);
    }
    

  },[model]);


  return (
    <View>
      <Text>{`PREDICT: ${out.label} ${out.prob}`}</Text>
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
