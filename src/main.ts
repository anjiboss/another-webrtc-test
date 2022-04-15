import io from "socket.io-client";
import { server_uri } from "./ultis/constant";
export const socket = io(server_uri, { reconnection: false });

let localStream: MediaStream | null = null;
let remoteStream: MediaStream | null = null;

// ANCHOR DOM Object
const webcamButton = document.getElementById(
  "webcamButton"
) as HTMLButtonElement;
const webcamVideo = document.getElementById("webcamVideo") as HTMLVideoElement;
const remoteVideo = document.getElementById("remoteVideo") as HTMLVideoElement;
const callButton = document.getElementById("callButton") as HTMLButtonElement;
// const offerInput = document.getElementById("offerInput") as HTMLInputElement;
// const answerInput = document.getElementById("answerInput") as HTMLInputElement;
// const messageInput = document.getElementById("message") as HTMLInputElement;
// const answerButton = document.getElementById(
//   "answerButton"
// ) as HTMLButtonElement;
// const acceptButton = document.getElementById(
//   "acceptButton"
// ) as HTMLButtonElement;
// const messageButton = document.getElementById(
//   "messageButton"
// ) as HTMLButtonElement;

// ANCHOR Define WebRTC Connection
const localConnection = new RTCPeerConnection({
  iceServers: [
    {
      urls: ["stun:ntk-turn-2.xirsys.com"],
    },
    {
      username:
        "GsnC6VY7KrUCZexx-odI48sFov5RtDGJnqokEg46R38Y9CBno4joO6BdKoiFjzzWAAAAAGJX3GdhbmppZGV2",
      credential: "983cc43a-bbcd-11ec-bc58-0242ac120004",
      urls: [
        "turn:ntk-turn-2.xirsys.com:80?transport=tcp",
        "turn:ntk-turn-2.xirsys.com:3478?transport=tcp",
        "turns:ntk-turn-2.xirsys.com:443?transport=tcp",
        "turns:ntk-turn-2.xirsys.com:5349?transport=tcp",
      ],
    },
  ],

  iceCandidatePoolSize: 10,
});

// SECTION 1. Set-up Media Source
// ANCHOR Send Screen
var displayMediaOptions: DisplayMediaStreamConstraints = {
  video: {},
  audio: false,
};

async function startCapture(displayMediaOptions: any) {
  let captureStream = null;

  try {
    captureStream = await navigator.mediaDevices.getDisplayMedia(
      displayMediaOptions
    );
  } catch (err) {
    console.error("Error: " + err);
  }
  return captureStream;
}
$("#screen").on("click", async () => {
  localStream = await startCapture(displayMediaOptions);

  remoteStream = new MediaStream();

  // Push tracks from local stream to peer connection
  localStream!.getTracks().forEach((track) => {
    localConnection.addTrack(track, localStream!);
  });

  // Pull tracks from remote stream, add to video stream
  localConnection.ontrack = (event) => {
    event.streams[0].getTracks().forEach((track) => {
      remoteStream!.addTrack(track);
    });
  };

  webcamVideo.srcObject = localStream;
  remoteVideo.srcObject = remoteStream;
});

// ANCHOR Send Camera
webcamButton.onclick = async () => {
  localStream = await navigator.mediaDevices.getUserMedia({
    video: true,
  });
  remoteStream = new MediaStream();

  // Push tracks from local stream to peer connection
  localStream!.getTracks().forEach((track) => {
    localConnection.addTrack(track, localStream!);
  });

  // Pull tracks from remote stream, add to video stream
  localConnection.ontrack = (event) => {
    event.streams[0].getTracks().forEach((track) => {
      remoteStream!.addTrack(track);
    });
  };

  webcamVideo.srcObject = localStream;
  remoteVideo.srcObject = remoteStream;
};
// !SECTION

// // 2. Create Call (Offer)
// callButton.onclick = async () => {
//   const offerDescription = await localConnection.createOffer();
//   await localConnection.setLocalDescription(offerDescription);
//   navigator.clipboard.writeText(JSON.stringify(offerDescription));
//   console.log("set local description", offerDescription);

//   //ANCHOR Set-up new candidate event
//   localConnection.onicecandidate = (e) => {
//     console.log({ candidate: e.candidate, json: e.candidate?.toJSON() });
//   };
// };

// // 3. Take offer and create Answer
// answerButton.onclick = async () => {
//   const offer = JSON.parse(offerInput.value);

//   // Set offer as remote description
//   const offerDescription = new RTCSessionDescription(offer);
//   console.log({ offerDescription });
//   localConnection.setRemoteDescription(offerDescription);
//   // Create answer
//   const answerDescription = await localConnection.createAnswer();
//   await localConnection.setLocalDescription(answerDescription);
//   console.log({ answerDescription });
//   navigator.clipboard.writeText(JSON.stringify(answerDescription));

//   //ANCHOR Set-up new candidate event
//   localConnection.onicecandidate = (e) => {
//     console.log({ candidate: e.candidate, json: e.candidate?.toJSON() });
//     if (e.candidate) {
//       navigator.clipboard.writeText(JSON.stringify(e.candidate?.toJSON()));
//     }
//   };
// };

// // 4. Answered, add candidate to peer connection
// acceptButton.onclick = async () => {
//   const answer = JSON.parse(answerInput.value);
//   const candidate = new RTCIceCandidate(answer);
//   localConnection.addIceCandidate(candidate);
// };

const qued: any[] = [];

// Peer A
callButton.onclick = async () => {
  localConnection.onicecandidate = (event) => {
    if (event.candidate) {
      // FIXME Send event.candidate.toJson() to server
      socket.emit("offer-send-candidate", {
        candidate: event.candidate.toJSON(),
      });
    }
  };

  // create offer
  const offerDescription = await localConnection.createOffer();
  await localConnection.setLocalDescription(offerDescription);
  // send offer to server
  // FIXME Send offer to server
  socket.emit("send-offer", {
    offer: offerDescription,
  });

  // Listen for remote answer
  // FIXME Take answer and set it to remoteDescription
  socket.on("answered", ({ answer }) => {
    console.log({ answer });
    if (!localConnection.currentRemoteDescription) {
      localConnection.setRemoteDescription(answer).then(() => {
        console.log("set remote des");
      });
    }
  });

  // When answered, add candidate to peer connections
  socket.on("add-answer-candidate", ({ answer }) => {
    if (localConnection.remoteDescription) {
      console.log("add-answer-candidate");
      const candidate = new RTCIceCandidate(answer);
      localConnection.addIceCandidate(candidate);
    }
  });
  localConnection.onconnectionstatechange = () => {
    console.log(
      "%c connection state change: ",
      "background: red; color: white",
      localConnection.connectionState
    );
  };
};

// Peer B
socket.on("get-offer", async ({ offer }) => {
  console.log("get-offer");
  localConnection.onicecandidate = (event) => {
    if (event.candidate) {
      // FIXME Sending candidate
      socket.emit("answer-send-candidate", {
        candidate: event.candidate.toJSON(),
      });
    }
  };

  await localConnection
    .setRemoteDescription(new RTCSessionDescription(offer))
    .then(async () => {
      console.log("set offer as remote description");
      if (qued.length > 0) {
        for (let i = 0; i < qued.length; i++) {
          await localConnection.addIceCandidate(new RTCIceCandidate(qued[i]));
        }
      }
    });
  const answerDescription = await localConnection.createAnswer();
  await localConnection.setLocalDescription(answerDescription);

  socket.emit("send-answer", { answer: answerDescription });
  localConnection.onconnectionstatechange = () => {
    console.log(
      "%c connection state change: ",
      "background: red; color: white",
      localConnection.connectionState
    );
  };
});

// Add candidate from Peer A (Offer)
socket.on("add-offer-candidate", ({ offer }) => {
  console.log("add-offer-candidate");
  if (localConnection.remoteDescription) {
    console.log("have remote des");
    const candidate = new RTCIceCandidate(offer);
    localConnection.addIceCandidate(candidate);
  } else {
    qued.push(offer);
    console.log(
      "%c Dont have remote description ",
      "background: red; color: white"
    );
  }
});
