function handleLocalAddCandidateSuccess() {
    connectButton.disabled = true;
}

function handleRemoteAddCandidateSuccess() {
    disconnectButton.disabled = false;
}

// function gotIceCandidate(event) {
//     console.log("gotIceCandidate: ", event);
//     if (event.candidate != null) {
//         console.log(JSON.stringify(event));
//         serverConnection.send(JSON.stringify({'type': 'ice', 'ice': event.candidate, 'id': id}));
//     }
// }

function gotIceCandidate(event) {
    console.log("gotIceCandidate!  ::iceState:"+event.target.iceConnectionState);//, event);
    // var dest = getIDfromPC(event.target);
    //console.log("target: "+ event.target);
    if (event.candidate != null) {
        //console.log(JSON.stringify(event));
        var hmmm = JSON.stringify({'type': 'ice', 'ice': event.candidate, 'id': id});
        serverConnection.send(hmmm);
    }
}

/*function createdDescription(description) {
    console.log('created description: ', description);

    peerConnection.setLocalDescription(description).then(function () {
        serverConnection.send(JSON.stringify({'type': 'sdp', 'sdp': peerConnection.localDescription, 'id': id
        }));
    }).catch(errorHandler);
}*/

function createdDescription2(description) {
    console.log('created description 2: ', description);
    return description;
    //peerConnection.setLocalDescription(description);

    //return(JSON.stringify({'type': 'sdp', 'sdp': peerConnection.localDescription, 'id': id}));

}

function errorHandler(error) {
    console.log(error);
}

function sendMessage() {
    var message = messageInputBox.value;
    dataChannel.send(message);
    messageInputBox.value = "";
    messageInputBox.focus();
}

// Handle status changes on the local end of the data
// channel; this is the end doing the sending of data
// in this example.
function handleSendChannelStatusChange(i, l) {
    console.log("datachannel change  ::" + i + "::" + l);
    var state;
    if (l === "ft") {
        if (fingerTable[i].dataChannel) {
            state = fingerTable[i].dataChannel.readyState;
            console.log("dataChannel state: " + state);

            if (state === "open") {
                messageInputBox.disabled = false;
                messageInputBox.focus();
                sendButton.disabled = false;
                disconnectButton.disabled = false;
                connectButton.disabled = true;
            } else {
                printFTButton.disabled = false;
                messageInputBox.disabled = true;
                sendButton.disabled = true;
                connectButton.disabled = false;
                disconnectButton.disabled = true;
            }
        }
    }
    if(l === "tp"){
        if (tempPeers[i].dataChannel) {
            state = tempPeers[i].dataChannel.readyState;
            console.log("dataChannel state: " + state);

            if (state === "open") {
                messageInputBox.disabled = false;
                messageInputBox.focus();
                sendButton.disabled = false;
                disconnectButton.disabled = false;
                connectButton.disabled = true;
            } else {
                printFTButton.disabled = false;
                messageInputBox.disabled = true;
                sendButton.disabled = true;
                connectButton.disabled = false;
                disconnectButton.disabled = true;
            }
        }
    }
}

// Called when the connection opens and the data
// channel is ready to be connected to the remote.
function receiveChannelCallback(event) {
    console.log("receiveChannel initialized  ::"+event.target);
    event.target.receiveChannel = event.channel;
    event.target.receiveChannel.onmessage = handleReceiveMessage;
}

// Handle status changes on the receiver's channel.  typeof receiveChannel !== 'undefined' &&
if (typeof receiveChannel !== 'undefined' && receiveChannel) {
    function handleReceiveChannelStatusChange(event) {
        console.log("Receive channel's status has changed to " +
            receiveChannel.readyState);
    }

    // Here you would do stuff that needs to be done
    // when the channel's status changes.
}

function disconnectPeers() {

    // Close the RTCDataChannels if they're open.

    dataChannel.close();
    receiveChannel.close();

    // Close the RTCPeerConnections

    peerConnection.close();

    dataChannel = null;
    receiveChannel = null;
    peerConnection = null;

    // Update user interface elements

    connectButton.disabled = false;
    disconnectButton.disabled = true;
    sendButton.disabled = true;

    messageInputBox.value = "";
    messageInputBox.disabled = true;
}
