import * as poseDetection from '@tensorflow-models/pose-detection';
import * as tf from '@tensorflow/tfjs';

let detector: poseDetection.PoseDetector | null = null;

export async function initializeMoveNet() {
  if (detector) {
    return detector;
  }

  await tf.ready();
  
  const model = poseDetection.SupportedModels.MoveNet;
  
  // Use the correct model type format
  const detectorConfig: poseDetection.movenet.MoveNetModelConfig = {
    modelType: 'SinglePose.Lightning' as any,
  };
  
  detector = await poseDetection.createDetector(model, detectorConfig);
  return detector;
}

export async function detectPose(video: HTMLVideoElement) {
  if (!detector) {
    await initializeMoveNet();
  }
  
  if (detector) {
    return await detector.estimatePoses(video);
  }
  
  return [];
}

