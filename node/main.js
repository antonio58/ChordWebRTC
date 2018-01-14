var peerConnection;
var id;
var m = 160;
var max = bigInt(2).pow(160);
var sdpStatus = false;
var fingerTable = [160];
var tempPeers = [];
var pred = {
    id: null,
    pc: null,
};

var peerConnectionConfig = {
    'iceServers': [
        {'urls': 'stun:stun.services.mozilla.com'},
        {'urls': 'stun:stun.l.google.com:19302'},
    ]
};

function pageReady() {

    //id = uuid();
    //console.log("pageReady (id: ", id,")");
    console.log("Page ready");

    serverConnection = new WebSocket('wss://' + window.location.hostname + ':8443');

    serverConnection.onmessage = gotMessageFromServer;

    connectButton = document.getElementById('connectButton');
    disconnectButton = document.getElementById('disconnectButton');
    sendButton = document.getElementById('sendButton');
    messageInputBox = document.getElementById('message');
    receiveBox = document.getElementById('receivebox');
    ftButton = document.getElementById('printFTButton');
    idtxt = document.getElementById('id');
    succtxt = document.getElementById('succ');
    predtxt = document.getElementById('pred');

    //fingerTable = newFingerTable();
}

// function start(isCaller) {
//
//     console.log("isCaller: ", isCaller);
//     peerConnection = new RTCPeerConnection(peerConnectionConfig);
//     peerConnection.onicecandidate = gotIceCandidate;
//     dataChannel = peerConnection.createDataChannel("dataChannel", {});
//     dataChannel.onopen = handleSendChannelStatusChange;
//     dataChannel.onclose = handleSendChannelStatusChange;
//     peerConnection.ondatachannel = receiveChannelCallback;
//     console.log("!!!");
//
//     //connectButton.disabled = true;
//     //disconnectButton.disabled = false;
//
//     if (isCaller) {
//         peerConnection.createOffer().then(createdDescription).catch(errorHandler);
//     }
// }

function gotMessageFromServer(message) {
    var n, data, dest, answer;
    //if (!peerConnection) start(false);
    var msg = JSON.parse(message.data);
    // Ignore messages from ourself
    if (msg.id === id) {
        console.log("me to me: discard!");
        return;
    }
    console.log("gotMessageFromServer:");
    console.log("|msg.id/id: '" + msg.id + "' / '" + id + "'\n|msg.type: " + msg.type);//+"\n|msg: "+JSON.stringify(msg));

    switch (msg.type) {
        case "newNode":
            id = msg.newid;
            console.log("id: " + id);
            idtxt.textContent = id;
            newSucc(msg.succ);
            //envia join ao sucessor
            if (msg.succ !== id) {
                serverConnection.send(JSON.stringify({'type': "join", 'id': id, 'dest': msg.succ}));
                connectTo(0);
            }

            break;

        case "join":
            console.log("join: " + msg.id);
            if (pred.id !== msg.id) {
                if (pred.id != null)
                    serverConnection.send(JSON.stringify({
                        'type': "notify",
                        'id': id,
                        'dest': pred.id,
                        'newsucc': msg.id
                    }));
                pred.id = msg.id;
                /*
                                pred.pc = new RTCPeerConnection(peerConnectionConfig);
                                pred.pc.onicecandidate = gotIceCandidate;
                                pred.dataChannel = pred.pc.createDataChannel("dataChannel", {});
                                pred.pc.ondatachannel = receiveChannelCallback;
                                pred.dataChannel.onopen = function(){console.log("pred data channel opened!")};
                                pred.dataChannel.onclose = function(){console.log("pred data channel closed!")};
                                pred.pc.onsignalingstatechange = function(){
                                    console.log("SignalingState: "+pred.pc.signalingState);
                                    console.log("ldesc / remdesc -> "+pred.pc.localDescription+" / "+pred.pc.remoteDescription);
                                    if(pred.pc.signalingState=== "stable" && pred.pc.localDescription !== null && pred.pc.remoteDescription){
                                        pred.pendingICE.forEach(function (value){
                                            pred.pc.addIceCandidate(value).catch(errorHandler);
                                        });
                                    }
                                };
                                pred.pendingICE = [];*/
                predtxt.textContent = msg.id;

            }
            break;

        case "notify":
            console.log("notify: " + msg.newsucc);
            newSucc(msg.newsucc);
            break;

        case "sdp":
            // Only create answers in response to offers
            n = checkTables(msg.id, true);
            console.log("sdp!");
            /*
                            var waspred = false;
                            if(pred.id === msg.id){
                                console.log("sdp ft - pred");
                                dest = msg.id;
                                console.log("pred.signalingState / connectionState: "+pred.pc.signalingState +" / "+pred.pc.connectionState);
                                console.log("ldesc / remdesc -> "+pred.pc.localDescription+" / "+pred.pc.remoteDescription);

                                pred.pc.setRemoteDescription(new RTCSessionDescription(msg.data)).then(function () {
                                    sdpStatus = true;
                                    console.log("sdp type: " + msg.data.type);
                                    if (msg.data.type == 'offer') {
                                        pred.pc.createAnswer().then(createdDescription2).then(function (sdp) {
                                            pred.pc.setLocalDescription(sdp).then(function () {
                                                console.log("(ft)sdp answer: " + sdp);
                                                serverConnection.send(sendThroughServer(pred.pc.localDescription, dest, "sdp"));
                                            }).catch(errorHandler);
                                        }).catch(errorHandler);
                                    }
                                }).catch(errorHandler);
                            }*/
            //console.log("msg.data: "+JSON.stringify(msg.data));
            console.log("n: " + JSON.stringify(n));
            if (n.t === "FT") {
                if (!fingerTable[n.n].sdpStatus || msg.data.type == 'answer') {

                    console.log("sdp ft");
                    //dest = fingerTable[n.n].id;
                    dest = msg.id;
                    /*data = JSON.parse(msg.data);*/
                    console.log("pc.signalingState / connectionState: " + fingerTable[n.n].pc.signalingState + " / " + fingerTable[n.n].pc.connectionState);
                    console.log("ldesc / remdesc -> " + fingerTable[n.n].pc.localDescription + " / " + fingerTable[n.n].pc.remoteDescription);

                    fingerTable[n.n].pc.setRemoteDescription(new RTCSessionDescription(msg.data)).then(function () {
                        fingerTable[n.n].sdpStatus = true;
                        console.log("sdp type: " + msg.data.type);
                        if (msg.data.type == 'offer') {
                            fingerTable[n.n].pc.createAnswer().then(createdDescription2).then(function (sdp) {
                                fingerTable[n.n].pc.setLocalDescription(sdp).then(function () {
                                    console.log("(ft)sdp answer: " + sdp);
                                    serverConnection.send(sendThroughServer(fingerTable[n.n].pc.localDescription, dest, "sdp"));
                                }).catch(errorHandler);
                            }).catch(errorHandler);
                        }
                    }).catch(errorHandler);
                }
            }
            //console.log("msg.data.sdp: \n"+msg.data.sdp);
            if (n.t === "TP") {
                if (!tempPeers[n.n].sdpStatus || msg.data.type == 'answer') {
                    console.log("sdp tp");
                    dest = tempPeers[n.n].id;
                    tempPeers[n.n].pc.setRemoteDescription(new RTCSessionDescription(msg.data)).then(function () {
                        fingerTable[n.n].sdpStatus = true;
                        if (msg.data.type === 'offer') {
                            answer = tempPeers[n.n].pc.createAnswer().then(createdDescription2).catch(errorHandler);
                            console.log("(tp)sdp answer: " + answer);
                            tempPeers[n.n].pc.setLocalDescription(answer);
                        }
                    }).catch(errorHandler);
                }
            } else
                console.log("sdp already set!");
            break;

        case
        "ice"
        :
            n = checkTables(msg.id, false);
            console.log("ice! /sdptatus:" + sdpStatus);
            if (n.t === "FT") {
                if (fingerTable[n.n].sdpStatus && n !== null) {
                    // dest = fingerTable[n.n].id;
                    fingerTable[n.n].pc.addIceCandidate(new RTCIceCandidate(msg.ice)).catch(errorHandler);
                    console.log("ft.signalingState(" + n.n + "): " + fingerTable[n.n].pc.signalingState);
                    console.log("ldesc / remdesc -> " + fingerTable[n.n].pc.localDescription + " / " + fingerTable[n.n].pc.remoteDescription);
                } else if (n !== null) {
                    fingerTable[n.n].pendingICE.push(msg.ice);
                }
            }
            if (n.t === "TP") {
                if (tempPeers[n.n].sdpStatus && n !== null) {
                    // dest = tempPeers[n.n].id;
                    tempPeers[n.n].pc.addIceCandidate(new RTCIceCandidate(msg.ice)).catch(errorHandler);
                } else if (n !== null) {
                    fingerTable[n.n].pendingICE.push(msg.ice);
                }
            }

            break;
    }
}

// Handle onmessage events for the receiving channel.
// These are the data messages sent by the sending channel
function handleReceiveMessage(event) {
    writeP(event.data);
}

function startUp(i, t) {
    console.log("starting up " + i + t);
    if (t === "ft") {
        fingerTable[i].pc.onicecandidate = gotIceCandidate;
        fingerTable[i].dataChannel = fingerTable[i].pc.createDataChannel("dataChannel", {});
        fingerTable[i].pc.ondatachannel = receiveChannelCallback;
        fingerTable[i].dataChannel.onopen = handleSendChannelStatusChange(i, "ft");
        fingerTable[i].dataChannel.onclose = handleSendChannelStatusChange(i, "ft");
        fingerTable[i].pc.onsignalingstatechange = function () {
            console.log("SignalingState: " + fingerTable[i].pc.signalingState);
            console.log("ldesc / remdesc -> " + fingerTable[i].pc.localDescription + " / " + fingerTable[i].pc.remoteDescription);
            if (fingerTable[i].pc.signalingState === "stable" && fingerTable[i].pc.localDescription !== null && fingerTable[i].pc.remoteDescription) {
                fingerTable[i].pendingICE.forEach(function (value) {
                    fingerTable[i].pc.addIceCandidate(value).catch(errorHandler);
                });
            }
        };
        fingerTable[i].sdpStatus = false;
    }
    if (t === "tp") {
        fingerTable[i].pc.onicecandidate = gotIceCandidate;
        tempPeers[i].dataChannel = fingerTable[i].pc.createDataChannel("dataChannel", {});
        tempPeers[i].pc.ondatachannel = receiveChannelCallback.then(function (event) {
            tempPeers[i].receiveChannel = event.channel;
            tempPeers[i].receiveChannel = handleReceiveMessage;
        });
        tempPeers[i].dataChannel.onopen = handleSendChannelStatusChange(i, "tp");
        tempPeers[i].dataChannel.onclose = handleSendChannelStatusChange(i, "tp");
        tempPeers[i].pc.onsignalingstatechange = function () {
            console.log("SignalingState: " + tempPeers[i].pc.signalingState);
            console.log("ldesc / remdesc -> " + tempPeers[i].pc.localDescription + " / " + tempPeers[i].pc.remoteDescription);

        };
        tempPeers[i].sdpStatus = false;
    }
}


function connectTo(i) {
    fingerTable[i].pc.createOffer().then(createdDescription2).then(function (sdp) {
        fingerTable[i].pc.setLocalDescription(sdp).then(function () {
            console.log("connectTo_ sdp: " + sdp);
            serverConnection.send(sendThroughServer(sdp, fingerTable[i].id, type = 'sdp'));
        });
    }).catch(errorHandler);

}

function errorHandler(error) {
    console.log(error);
}

function writeP(data) {
    var el = document.createElement("p");
    var txtNode = document.createTextNode(data);

    el.appendChild(txtNode);
    receiveBox.appendChild(el);
}

function newTempPeer(id) {
    var me = {
        pc: new RTCPeerConnection(peerConnectionConfig),
        id: id,
        pendingICE: []
    };
    return me;
}

function newFTElement(i, id) {
    var me = {
        pc: new RTCPeerConnection(peerConnectionConfig),
        id: id,
        i: i,
        pendingICE: []
        //f: fingerIndex(id),
    };
    return me;
}

function printFTButton(event) {
    serverConnection.send(JSON.stringify({'type': "newNode"}));

    var el = document.createElement("p");
    var txtNode = document.createTextNode(JSON.stringify(fingerTable));
    el.appendChild(txtNode);

}

function newSucc(succ) {
    console.log("new succ: " + succ);
    var auxPeer;
    if (fingerTable.length > 0) {
        auxPeer = fingerTable[0];
        fingerTable.shift();
    }
    fingerTable.unshift(newFTElement(fingerIndex(0), succ));
    startUp(0, "ft");
    var n = checkTables(auxPeer.id, false);
    if (n.t === "ft") {
        fingerTable[n.n] = auxPeer;
    } else if (n.t === "tp") {
        tempPeers[n.n] = auxPeer;
    }
    succtxt.textContent = succ;
}

function sendThroughServer(data, dest, type) {
    console.log("sendThroughServer: " + dest + " / " + type + " / " + data);
    return JSON.stringify({'type': type, 'id': id, 'dest': dest, 'data': data});
}

function checkTables(id, add) {
    var loc = "OoOops";
    var k;
    var n = inFT(id);
    console.log('add: ' + add);
    if (n === null) {
        n = checkFT(id);
        console.log('n2: ' + n);
        if (n.length === 0) {
            n = inTP(id);
            loc = "TP";
            console.log('n3: ' + n);
            if (n === null && add) {
                n = tempPeers.length;
                tempPeers.push(newTempPeer(id));
                startUp(0, "tp");
            }
        } else {
            loc = "FT";
            var flag = true;
            fingerTable.forEach(function (value, index) {
                console.log("value.i/index/id " + value.i.toString() + " / " + index + " / " + value.id);
                n.forEach(function (v, i) {
                    if (v.equals(value.i)) {
                        flag = false;
                        if (value.id === id) {
                            k = index;
                            return {t: loc, n: n};
                        } else {
                            if (index === 0 && add) {
                                console.log("check produced new succ");
                                newSucc(id);
                            } else if (add) {
                                console.log("nao foi succ, foi " + index);
                                fingerTable[index] = newFTElement(v, id);
                                startUp(index, "ft");
                            }
                            console.log("k: " + index);
                            k = index;
                        }
                    }
                });
                /*
                                if (n.includes(value.i)) {
                                    if(index===0){
                                        console.log("check produced new succ");
                                        newSucc(id);
                                    }else {
                                        console.log("nao foi succ, foi "+index);
                                        fingerTable[index] = newFTElement(value.i, id);
                                        startUp(index, "ft");
                                    }
                                    console.log(typeof index);
                                    k = index;
                                }
                */
            });
            if (flag && add) {
                // var flag2 = true;
                // var i = ;
                // do {
                console.log("checktables last if");
                k = fingerTable.length;
                fingerTable.push(newFTElement(fingerIndex(k), id));
                startUp(k, "ft");
                // }while(flag2)
            }

            n = k;
            console.log('n4: ' + n);
        }
    } else
        loc = "FT";
    return {t: loc, n: n};
}

function inFT(id) {
    fingerTable.forEach(function (item, index, array) {
        if (item.id === id)
            return index;
    });
    return null;
}

function inTP(id) {
    tempPeers.forEach(function (item, index, array) {
        if (item.id === id)
            return index;
    });
    return null;
}

function checkFT(dest) {
    var newfinger = [];
    biid = bigInt(id, 16);
    bidest = bigInt(dest, 16);
    console.log("id: " + biid.toString() + ", dest: " + bidest + ", m: " + m + ", 2^m:" + max.toString());
    for (var j = 1; j <= m; j++) {
        var aux = bigInt(2).pow(j - 1);
        //fi = bigInt(id, 16);
        //aux = aux.plus(bigInt(id, 16));
        var fi = biid.plus(aux);
        if (fi.greater(max))
            fi = fi.minus(max);

        if (typeof fingerTable[j - 1] !== 'undefined') {
            var biprev = bigInt(fingerTable[j - 1].id, 16);
            console.log("ID+2^" + j + "-1: " + fi.toString() + "    (" + aux.toString() + ") / ft.id: " + biprev.toString());
            // console.log("dest/fi/ft[j-1]: " + bigInt(dest, 16).toString() + " / " + fi.toString() + " / " + bigInt(fingerTable[j - 1].id, 16).toString());
            if ((bidest.greaterOrEquals(fi) && !bidest.greater(biprev)) ||
                (fi.greater(biprev) && biprev.greaterOrEquals(bidest) && biid.greater(bidest)) ||
                (bidest.greaterOrEquals(fi) && biid.greater(biprev) && bidest.greaterOrEquals(biprev))) {

                newfinger.push(fi);
                if (j < 5) console.log("checkFT_ j d: " + j);
            }
        }
        else {
            if (j < 5) console.log("checkFT_ j u: " + j);
            newfinger.push(fi)
            //if(((j/m)*100)%10===0)
            //console.log("filling the table "+(j/m)*100+"%");
        }
        prev = fi;
    }
    //console.log("new finger: " + newfinger);
    return newfinger;
}

function isnewFinger(newid, oldid, fi) {
    aux;
}

function newFingerTable() {
    for (var i = 1; i <= m; i++) {
        fingerTable[i] = newFTElement(fingerIndex(i), 0);
    }
    console.log("FT ready");
}

//TODO: resolver o que quer que seja isto a seguir
function fingerIndex(i) {

    var aux = bigInt(2).pow(i);
    aux = bigInt(id, 16).plus(aux);
    if (aux.greater(max))
        aux = aux.minus(max);
    return aux;
}

function getIDfromPC(pc) {
    fingerTable.forEach(function (value, index) {
        if (fingerTable[index].pc === pc) {
            return index;
        }
    });
}


