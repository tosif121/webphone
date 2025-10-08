// hooks/jssip/useJssipRecording.js
import { useEffect } from 'react';

export const useJssipRecording = (state, utils) => {
  const {
    session,
    isRecording,
    setIsRecording,
    mediaRecorder,
    setMediaRecorder,
    selectedDeviceId,
    setSelectedDeviceId,
    devices,
    setDevices,
    chunks,
    agentSocketRef,
    customerSocketRef,
    agentMediaRecorderRef,
    customerMediaRecorderRef,
    origin,
    status,
  } = state;

  const initializeWebSocketTranscription = () => {
    const createWebSocket = (isAgent = true) => {
      const socketRef = isAgent ? agentSocketRef : customerSocketRef;
      const socket = new WebSocket(`wss://${origin}/socket`);

      socketRef.current = socket;

      socket.onopen = () => {
        // console.log(`${isAgent ? 'Agent' : 'Customer'} WebSocket Connected`);
      };

      socket.onerror = (error) => {
        // console.error(`${isAgent ? 'Agent' : 'Customer'} WebSocket Error:`, error);
      };

      socket.onclose = () => {
        // console.log(`${isAgent ? 'Agent' : 'Customer'} WebSocket Closed`);
        setTimeout(() => {
          createWebSocket(isAgent);
        }, 3000);
      };

      return socket;
    };

    createWebSocket(true);
    createWebSocket(false);
  };

  const startSpeechToText = (stream, isAgent = true) => {
    const websocket = isAgent ? agentSocketRef.current : customerSocketRef.current;
    const mediaRecorderRef = isAgent ? agentMediaRecorderRef : customerMediaRecorderRef;

    if (!websocket || websocket.readyState !== WebSocket.OPEN) {
      if (websocket?.readyState === WebSocket.CLOSING || websocket?.readyState === WebSocket.CLOSED) {
        initializeWebSocketTranscription();
      }

      return;
    }

    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: 'audio/webm;codecs=opus',
    });

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0 && websocket.readyState === WebSocket.OPEN) {
        websocket.send(event.data);
      }
    };

    mediaRecorder.onstop = async () => {
      const tracks = stream.getAudioTracks();
      tracks.forEach((track) => track.stop());

      if (websocket.readyState === WebSocket.OPEN) {
        websocket.send(JSON.stringify('streamClose'));
      }
    };

    mediaRecorder.start(1000);
    mediaRecorderRef.current = mediaRecorder;
  };

  const stopSpeechToText = (isAgent = true) => {
    const mediaRecorderRef = isAgent ? agentMediaRecorderRef : customerMediaRecorderRef;
    const websocket = isAgent ? agentSocketRef.current : customerSocketRef.current;

    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
    }

    if (websocket && websocket.readyState === WebSocket.OPEN) {
      websocket.send(JSON.stringify('streamClose'));
    }
  };

  const startRecording = async () => {
    if (!session || isRecording) return;

    try {
      const combinedStream = new MediaStream();

      const micStream = await navigator.mediaDevices.getUserMedia({
        audio: selectedDeviceId ? { deviceId: { exact: selectedDeviceId } } : true,
      });

      const remoteReceivers = session.connection.getReceivers() || [];
      const remoteTracks = remoteReceivers
        .filter((receiver) => receiver.track?.kind === 'audio')
        .map((receiver) => receiver.track)
        .filter(Boolean);

      startSpeechToText(micStream, true);
      if (remoteTracks.length > 0) {
        const remoteStream = new MediaStream(remoteTracks);
        startSpeechToText(remoteStream, false);
      }

      remoteTracks.forEach((track) => {
        combinedStream.addTrack(track);
      });

      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const destination = audioContext.createMediaStreamDestination();

      const localSource = audioContext.createMediaStreamSource(micStream);
      localSource.connect(destination);

      if (remoteTracks.length > 0) {
        const remoteStream = new MediaStream(remoteTracks);
        const remoteSource = audioContext.createMediaStreamSource(remoteStream);
        remoteSource.connect(destination);
      }

      const recorder = new MediaRecorder(destination.stream, {
        mimeType: 'audio/webm',
      });

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.current.push(event.data);
        }
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    stopSpeechToText(true);
    stopSpeechToText(false);
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks.current, { type: 'audio/webm' });
        chunks.current = [];

        convertToWav(blob).then((wavBlob) => {
          const audioUrl = URL.createObjectURL(wavBlob);
          const audioLink = document.createElement('a');
          audioLink.href = audioUrl;
          audioLink.download = `call-recording-${new Date().toISOString()}.wav`;
          audioLink.click();
          URL.revokeObjectURL(audioUrl);
        });
      };
    }
  };

  const convertToWav = async (blob) => {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const arrayBuffer = await blob.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

    const numberOfChannels = audioBuffer.numberOfChannels;
    const length = audioBuffer.length;
    const sampleRate = audioBuffer.sampleRate;
    const wavBuffer = audioContext.createBuffer(numberOfChannels, length, sampleRate);

    for (let channel = 0; channel < numberOfChannels; channel++) {
      const channelData = audioBuffer.getChannelData(channel);
      wavBuffer.copyToChannel(channelData, channel);
    }

    const wavData = encodeWAV(wavBuffer);
    return new Blob([wavData], { type: 'audio/wav' });
  };

  const encodeWAV = (audioBuffer) => {
    const numChannels = audioBuffer.numberOfChannels;
    const sampleRate = audioBuffer.sampleRate;
    const format = 1;
    const bitDepth = 16;

    const bytesPerSample = bitDepth / 8;
    const blockAlign = numChannels * bytesPerSample;

    const buffer = audioBuffer.getChannelData(0);
    const samples = buffer.length;
    const dataSize = samples * blockAlign;
    const headerSize = 44;
    const totalSize = headerSize + dataSize;

    const arrayBuffer = new ArrayBuffer(totalSize);
    const dataView = new DataView(arrayBuffer);

    writeString(dataView, 0, 'RIFF');
    dataView.setUint32(4, totalSize - 8, true);
    writeString(dataView, 8, 'WAVE');
    writeString(dataView, 12, 'fmt ');
    dataView.setUint32(16, 16, true);
    dataView.setUint16(20, format, true);
    dataView.setUint16(22, numChannels, true);
    dataView.setUint32(24, sampleRate, true);
    dataView.setUint32(28, sampleRate * blockAlign, true);
    dataView.setUint16(32, blockAlign, true);
    dataView.setUint16(34, bitDepth, true);
    writeString(dataView, 36, 'data');
    dataView.setUint32(40, dataSize, true);

    let offset = 44;
    for (let i = 0; i < samples; i++) {
      for (let channel = 0; channel < numChannels; channel++) {
        const sample = audioBuffer.getChannelData(channel)[i];
        const value = Math.max(-1, Math.min(1, sample));
        dataView.setInt16(offset, value * 0x7fff, true);
        offset += bytesPerSample;
      }
    }

    return arrayBuffer;
  };

  const writeString = (dataView, offset, string) => {
    for (let i = 0; i < string.length; i++) {
      dataView.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  const changeAudioDevice = async (deviceId) => {
    setSelectedDeviceId(deviceId);
    if (session) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: { deviceId: { exact: deviceId } },
        });
        session.connection.getSenders()[0].replaceTrack(stream.getAudioTracks()[0]);
      } catch (error) {
        console.error('Error changing audio device:', error);
      }
    }
  };

  useEffect(() => {
    if (status != 'start') {
      initializeWebSocketTranscription();
    }

    return () => {
      if (agentSocketRef.current) {
        agentSocketRef.current.close();
      }
      if (customerSocketRef.current) {
        customerSocketRef.current.close();
      }
    };
  }, []);

  return {
    startRecording,
    stopRecording,
    changeAudioDevice,
    initializeWebSocketTranscription,
    startSpeechToText,
    stopSpeechToText,
  };
};
