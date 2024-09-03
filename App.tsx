import React, { useEffect, useState } from 'react';
import {
  Button,
  PermissionsAndroid,
  StyleSheet,
  Text,
  View,
  Dimensions
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
  const [color,setColor] = useState("red");

  const lesionColors = new Map();
  lesionColors.set("Melanocytic Nevi", "#90EE90");
  lesionColors.set("Dermatofibroma", "#FFFFE0");
  lesionColors.set("Benign Keratosis-Like Lesion", "#FFDAB9");
  lesionColors.set("Vascular Lesion", "#ADD8E6");
  lesionColors.set("Basal Cell Carcinoma", "#FFC0CB");
  lesionColors.set("Bowen's Disease", "#FF6347");
  lesionColors.set("Melanoma", "#000000");
  const handleResultado = useRunOnJS((resultado) => {
    setOuta(resultado);
    setColor(lesionColors.get(resultado.label[0]));
    
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
    
    const lables = ["Bowen's Disease","Basal Cell Carcinoma","Benign Keratosis-Like Lesion", "Dermatofibroma","Melanoma","Melanocytic Nevi","Vascular Lesion"]
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
    <View style={styles.container}>
      <Text style={[styles.text,{backgroundColor: color}]}>{`${out.label} ${out.prob.toFixed(3)}`}</Text>
      <View style={[styles.cameraContainer,{borderColor: color}]}>
        {permission ? <Camera  frameProcessor={frameProcessor}  style={[styles.camera]} device={device} isActive={true}/> : <Text>forneça</Text>}  
      </View>
      
      
    </View>
  );
}


const height = Dimensions.get('window').height;
const width = Dimensions.get('window').width;
const styles = StyleSheet.create({
  container:{
    flex:1
  },
  camera: {
    flex: 1
  },
  cameraContainer: {
    borderWidth: 5,
    flex:1
  },
  text: {
    height: height*0.05,
    fontSize:22,
    color: 'white',
  }
});





export default App;
