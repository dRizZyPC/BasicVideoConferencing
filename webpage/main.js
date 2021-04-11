// Config variables
const SIGNALING_SERVER_URL = 'http://localhost:9999';
const PC_CONFIG = {};

// Signaling
let socket = io(SIGNALING_SERVER_URL, { autoConnect: false });

socket.on('data', (data) => {
  console.log('Data received: ',data);
  handleSignalingData(data);
});

socket.on('ready', () => {
  console.log('Ready');
  createPeerConnection();
  sendOffer();
});

let sendData = (data) => {
  socket.emit('data', data);
};

// WebRTC variables
let pc;
let localStream;
let remoteStreamElement = document.querySelector('#remoteStream');

// Get the media stream from the browser
let getLocalStream = () => {
    navigator.mediaDevices.getUserMedia({ audio: true, video: true })
      .then((stream) => {
        console.log('Stream found');
        localStream = stream;
        // Connect after making sure that local stream is availble
        socket.connect();
      })
      .catch(error => {
        console.error('Stream not found: ', error);
      });
}

// Create a peer connection
let createPeerConnection = () => {
    try {
        pc = new RTCPeerConnection(PC_CONFIG);
        pc.onicecandidate = onIceCandidate;
        pc.onaddstream = onAddStream;
        pc.addStream(localStream);
        console.log('PeerConnection created');
    } catch (error) {
        console.error('PeerConnection failed: ', error);
    }
};

// Offer and answer logic
let sendOffer = () => {
    console.log('Send offer');
    pc.createOffer().then(
        setAndSendLocalDescription,
        (error) => { console.error('Send offer failed: ', error); }
    );
};

let sendAnswer = () => {
    console.log('Send answer');
    pc.createAnswer().then(
        setAndSendLocalDescription,
        (error) => { console.error('Send answer failed: ', error); }
    );
};

let setAndSendLocalDescription = (sessionDescription) => {
    pc.setLocalDescription(sessionDescription);
    console.log('Local description set');
    sendData(sessionDescription);
};

// WebRTC Callbacks
let onIceCandidate = (event) => {
    if (event.candidate) {
      console.log('ICE candidate');
      sendData({
        type: 'candidate',
        candidate: event.candidate
      });
    }
};
  
let onAddStream = (event) => {
    console.log('Add stream');
    remoteStreamElement.srcObject = event.stream;
};

// Handle Incoming Data
let handleSignalingData = (data) => {
    switch (data.type) {
      case 'offer':
        createPeerConnection();
        pc.setRemoteDescription(new RTCSessionDescription(data));
        sendAnswer();
        break;
      case 'answer':
        pc.setRemoteDescription(new RTCSessionDescription(data));
        break;
      case 'candidate':
        pc.addIceCandidate(new RTCIceCandidate(data.candidate));
        break;
    }
};

// Start connection
getLocalStream();
