var peerConnection;
var id;
var m = 160;
var max = bigInt(2).pow(160);
var sdpStatus = false;
var fingerTable = [];
var tempPeers = [];
var pred = {
    id: null,
    pc: null,
};
var pendingFinds = [];
var files = ["9e4af7f6b3fe2391aaa4e9a8ce4193df8dc48450"];
var pic;
var stableCount = 0;
var downList = [];
var downCount = [];

//Configuraçao dos servidores ICE
var peerConnectionConfig = {
    'iceServers': [
        {'urls': 'stun:stun.services.mozilla.com'},
        {'urls': 'stun:stun.l.google.com:19302'}
    ]
};

//codigo a executar quando a página acaba de carregar
function pageReady() {

    console.log("Page ready");
    //ligaçao servidor
    serverConnection = new WebSocket('wss://' + window.location.hostname + ':8443');
    serverConnection.onmessage = gotMessageFromServer;

    //setup dos elementos html
    disconnectButton = document.getElementById('disconnectButton');
    ftButton = document.getElementById('printFTButton');

    idtxt = document.getElementById('id');
    succtxt = document.getElementById('succ');
    predtxt = document.getElementById('pred');

    sendButton = document.getElementById('sendButton');
    inputI = document.getElementById('fi');
    messageInputBox = document.getElementById('message');
    receiveBox = document.getElementById('receivebox');

    inputKey = document.getElementById('key');
    inputI2 = document.getElementById('fi2');

    //fingerTable = newFingerTable();
}

function gotMessageFromServer(message) {
    var n, data, dest, answer;
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
            connectTo(0);
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
                    console.log(n.n + ".signalingState: " + fingerTable[n.n].pc.signalingState);
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
            else if (n.t === "TP") {
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

        case "ice":
            n = checkTables(msg.id, false);
            console.log("n, n.n : " + JSON.stringify(n) + ", " + n.n);
            if (n.n === undefined) {
                n = checkTables(msg.id, true);
                connectTo(n.n);
            }
            console.log("ice! /sdptatus:" + fingerTable[n.n].sdpStatus);
            if (n.t === "FT") {
                if (fingerTable[n.n].sdpStatus && n !== null) {
                    // dest = fingerTable[n.n].id;
                    fingerTable[n.n].pc.addIceCandidate(new RTCIceCandidate(msg.ice)).catch(errorHandler);
                    console.log("ft.signalingState(" + n.n + "): " + fingerTable[n.n].pc.signalingState);
                    console.log("ldesc / remdesc -> " + fingerTable[n.n].pc.localDescription + " / " + fingerTable[n.n].pc.remoteDescription);
                } else if (n !== null) {
                    fingerTable[n.n].pendingICE.push(msg.ice);
                    console.log("ice push (" + n.n + ")");
                }
            }
            if (n.t === "TP") {
                if (tempPeers[n.n].sdpStatus && n !== null) {
                    // dest = tempPeers[n.n].id;
                    tempPeers[n.n].pc.addIceCandidate(new RTCIceCandidate(msg.ice)).catch(errorHandler);
                } else if (n !== null) {
                    fingerTable[n.n].pendingICE.push(msg.ice);
                    console.log("ice push (" + n.n + ")");
                }
            }

            break;
    }
}

//mensagens recebidas pelo datachannel
function handleReceiveMessage(event) {
    console.log("Datachannel!"/* From: " + event.target.label + " /msg: " + event.data*/);

    var msg = JSON.parse(event.data);

    switch (msg.type) {
        case "findKSucc":
            findKeySuccessor(msg.key, msg.source).then(function (n) {
                if (n === null) {
                    pendingFinds.push({"type": msg.type, "source": msg.source, "key": msg.key, "id": msg.id});
                }
                else if (n === "succ") {
                    n = checkTables(msg.id, false);
                    if (n.t === "FT") {
                        fingerTable[n.n].sendChannel.send(JSON.stringify({
                            "type": "gotKSucc",
                            "source": msg.source,
                            "key": msg.key,
                            "id": id,
                            "succ": fingerTable[0].id
                        }));
                    }
                    if (n.t === "TP") {
                        tempPeers[n.n].sendChannel.send(JSON.stringify({
                            "type": "gotKSucc",
                            "source": msg.source,
                            "key": msg.key,
                            "id": id,
                            "succ": fingerTable[0].id
                        }));
                    }
                }
            });
            break;

        case "gotKSucc":
            if (msg.source === id) {
                console.log("gotksucc source==id");
                if (inFT(msg.succ) !== null) {
                    fingerTable[i].sendChannel.send(JSON.stringify({"type": "reqFile", "id": id, "key": msg.key}));
                } else {
                    var n = checkTables(msg.succ, true);
                    if (n.t === "FT") {
                        fingerTable[n.n].sendChannel.send(JSON.stringify({
                            "type": "reqFile",
                            "key": msg.key,
                            "id": id
                        }));
                    }
                    if (n.t === "TP") {
                        tempPeers[n.n].sendChannel.send(JSON.stringify({
                            "type": "gotKSucc",
                            "key": msg.key,
                            "id": id
                        }));
                    }
                }

            } else
                pendingFinds.forEach(function (value, index) {
                    if (value.source === msg.source && value.key === msg.key) {
                        var n = checkTables(value.id, false);
                        if (n.t === "FT") {
                            fingerTable[n.n].sendChannel.send(JSON.stringify({
                                "type": "gotKSucc",
                                "source": msg.source,
                                "key": msg.key,
                                "id": id,
                                "succ": msg.succ
                            }));
                        }
                        if (n.t === "TP") {
                            tempPeers[n.n].sendChannel.send(JSON.stringify({
                                "type": "gotKSucc",
                                "source": msg.source,
                                "key": msg.key,
                                "id": id,
                                "succ": msg.succ
                            }));
                        }
                        pendingFinds.splice(index, 1);
                    }
                });
            break;

        case "stabilize":
            if (pred.id !== null) {
                n = checkTables(msg.id, false);
                // console.log("sending pred to: " + fingerTable[n.n].id + " " + msg.id);
                if (n.t === "FT") {
                    fingerTable[n.n].sendChannel.send(JSON.stringify({
                        "type": "pred",
                        "pred": pred.id,
                        "id": id
                    }));
                }
                if (n.t === "TP") {
                    fingerTable[n.n].sendChannel.send(JSON.stringify({
                        "type": "pred",
                        "pred": pred.id,
                        "id": id
                    }));
                }
            }
            break;

        case "pred":
            if (msg.id === fingerTable[0].id && msg.pred !== id && pred !== null) {
                console.log("unstable!");
                n = checkTables(msg.pred, true);
                connectTo(n.n);
            } //else console.log("stable!");
            break;

        case "img":
            var el = document.createElement("p");
            var ul = document.querySelector("#bag>ul");

            var li = document.createElement("li");
            li.innerHTML = event.data;
            //ul.appendChild(li);
            document.getElementById("pre").src = msg.data;
            break;

        default:
            writeP(event.data);
            break;
    }
}

//inicia os parametros de uma RTCPeerConnection
function startUp(i, t) {
    console.log("starting up " + i + t);
    if (t === "ft") {
        fingerTable[i].sdpStatus = false;
        fingerTable[i].pc.onicecandidate = function (event) {
            if (event.candidate != null) {
                var hmmm = JSON.stringify({'type': 'ice', 'ice': event.candidate, 'id': id, 'dest': fingerTable[i].id});
                serverConnection.send(hmmm);
            }
        };
        fingerTable[i].sendChannel = fingerTable[i].pc.createDataChannel("sendChannel." + i + "." + t);
        fingerTable[i].pc.ondatachannel = function (event) {
            fingerTable[i].receiveChannel = event.channel;
            fingerTable[i].receiveChannel.onmessage = handleReceiveMessage;
            fingerTable[i].receiveChannel.onopen = function () {
                console.log("(" + i + ") Receive channel's status has changed to " +
                    fingerTable[i].receiveChannel.readyState);
            };
            fingerTable[i].receiveChannel.onclose = function () {
                console.log("(" + i + ") Receive channel's status has changed to closed //" + fingerTable[i].sendChannel.readyState);
                if (i === 0 && fingerTable[i].sendChannel.readyState === 'closed') {
                    console.log("restarting succ");
                    serverConnection.send(JSON.stringify({'type': "join", 'id': id, 'dest': fingerTable[0].id}));
                    newSucc(fingerTable[0].id);
                    connectTo(0);
                }
                else if (fingerTable[i].sendChannel.readyState === 'closed' /*&& fingerTable[i].sdpStatus === true*/) {
                    restartFinger(i);
                }
            };
        };
        // console.log("receiveChannel: "+fingerTable[i].receiveChannel.readyState+ " /sendChannel: "+fingerTable[i].sendChannel.readyState);
        fingerTable[i].sendChannel.onopen = handleSendChannelStatusChange(i, "ft", "open");
        fingerTable[i].sendChannel.onclose = handleSendChannelStatusChange(i, "ft", "close");
        fingerTable[i].pc.onsignalingstatechange = function () {
            console.log("SignalingState(" + i + "): " + fingerTable[i].pc.signalingState);
            //console.log("ldesc / remdesc -> " + fingerTable[i].pc.localDescription + " / " + fingerTable[i].pc.remoteDescription);
            if (fingerTable[i].pc.signalingState === "stable" && fingerTable[i].pc.localDescription !== null && fingerTable[i].pc.remoteDescription) {
                fingerTable[i].pendingICE.forEach(function (value) {
                    fingerTable[i].pc.addIceCandidate(value).catch(errorHandler);
                    console.log("ice pop (" + i + ")");
                });
            }
            if (fingerTable[i].pc.signalingState === "closed") {
                // aux = fingerTable[i].id;
                // fingerTable[i] = newFTElement(fingerIndex(i), aux);
                // startUp(i, "ft");
                // connectTo(i);
            }
        };
    }
    if (t === "tp") {
        fingerTable[i].pc.onicecandidate = gotIceCandidate;
        tempPeers[i].sendChannel = fingerTable[i].pc.createDataChannel("sendChannel");
        tempPeers[i].pc.ondatachannel = receiveChannelCallback.then(function (event) {
            tempPeers[i].receiveChannel = event.channel;
            tempPeers[i].receiveChannel = handleReceiveMessage;
        });
        tempPeers[i].sendChannel.onopen = handleSendChannelStatusChange(i, "tp", "open");
        tempPeers[i].sendChannel.onclose = handleSendChannelStatusChange(i, "tp", "close");
        tempPeers[i].pc.onsignalingstatechange = function () {
            console.log("SignalingState: " + tempPeers[i].pc.signalingState);
            console.log("ldesc / remdesc -> " + tempPeers[i].pc.localDescription + " / " + tempPeers[i].pc.remoteDescription);

        };
        tempPeers[i].sdpStatus = false;
    }
}

//Inicia a ligação com peer
function connectTo(i) {
    fingerTable[i].pc.createOffer().then(createdDescription2).then(function (sdp) {
        fingerTable[i].pc.setLocalDescription(sdp).then(function () {
            console.log("connectTo_ sdp(" + i + "): " + sdp);
            serverConnection.send(sendThroughServer(sdp, fingerTable[i].id, type = 'sdp'));
        });
    }).catch(errorHandler);

}

function errorHandler(error) {
    console.log(error);
}

//escreve na página web
function writeP(data) {
    var el = document.createElement("p");
    var txtNode = document.createTextNode(data);

    el.appendChild(txtNode);
    receiveBox.appendChild(el);
}

//novo elemento da tabela de peers temporarios
function newTempPeer(id) {
    var me = {
        pc: new RTCPeerConnection(peerConnectionConfig),
        id: id,
        pendingICE: []
    };
    return me;
}

//novo elemento da finger table
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

//envia mensagem ao servidor para se ligar à rede p2p
function joinNetwork(event) {
    serverConnection.send(JSON.stringify({'type': "newNode"}));

    setInterval(stabilizeF, 1000);
    //setInterval(checkConn, 1000);

}

//Estabelece o novo sucessor
function newSucc(succ) {
    console.log("new succ: " + succ);
    var auxPeer;
    if (fingerTable.length > 0) {
        // auxPeer = fingerTable[0];
        fingerTable[0].pc.close();
        fingerTable.shift();
    }
    fingerTable.unshift(newFTElement(fingerIndex(0), succ));
    startUp(0, "ft");
    serverConnection.send(JSON.stringify({'type': "join", 'id': id, 'dest': succ}));
    // var n = checkTables(auxPeer.id, true);
    succtxt.textContent = succ;
}

//Envia uma mensagem para outro peer através do servidor
//usado para o signaling
function sendThroughServer(data, dest, type) {
    console.log("sendThroughServer: " + dest + " / " + type + " / " + data);
    return JSON.stringify({'type': type, 'id': id, 'dest': dest, 'data': data});
}

//verifica se um id está ou se pode ser adicionado à finger table
//tem a opção de verificação apenas ou de addicionar mesmo
//na opção de adicionar caso não encaixe na finger table é
//colocado na tabela de peers temporários
function checkTables(newid, add) {
    var loc = "OoOops";
    var k;

    /*if(fingerTable[0].id === id){
        console.log("Replaced self as succ");
        if(newid===null)
            newid = id;
        newSucc(newid);
        return {t: "ft", n:0};

    }*/
    var n = inFT(newid);
    // console.log("!!N: " + n);
    if (n === null) {
        console.log('add: ' + add);
        n = checkFT(newid);
        console.log('n2(' + n.length + '): ' + n);
        if (n.length === 0) {
            n = inTP(newid);
            loc = "TP";
            console.log('n3: ' + n);
            if (n === null && add) {
                n = tempPeers.length;
                tempPeers.push(newTempPeer(newid));
                startUp(0, "tp");
            }
        } else {
            loc = "FT";
            // fingerTable[n[0]] = newFTElement(n[0], newid);

            flag = true;
            if (fingerTable[n[0]] !== undefined) {
                if (fingerTable[n[0]].id === newid) {

                    k = n[0];
                    return {t: loc, n: k};
                }
            }
            if (add) {
                if (n[0] === 0) {
                    console.log("check produced new succ");
                    aux = fingerTable[0].id;
                    newSucc(newid);
                    connectTo(0);
                    flag = false;
                    /*if (aux !== id) {
                        aux = checkTables(aux, true);
                        if (aux.n !== undefined)
                            connectTo(aux.n);
                    }*/
                } else {
                    console.log("nao foi succ, foi " + n[0]);
                    aux = id;
                    if (fingerTable[n[0]] !== undefined) {
                        aux = fingerTable[n[0]].id;
                        fingerTable[n[0]].pc.close();
                    }
                    fingerTable[n[0]] = newFTElement(fingerIndex(n[0]), newid);
                    startUp(n[0], "ft");
                    flag = false;
                    /*if (aux !== id) {
                        aux = checkTables(aux, true);
                        if (aux.n !== undefined)
                            connectTo(aux.n);
                    }*/
                }
                console.log("k: " + n[0]);
                k = n[0];
            }

            if (flag && add) {
                // var flag2 = true;
                // var i = ;
                // do {
                console.log("checktables last if");
                k = fingerTable.length;
                fingerTable.push(newFTElement(fingerIndex(k), newid));
                startUp(k, "ft");
                // }while(flag2)
            }
            inputI.setAttribute("max", fingerTable.length);
            n = k;
            console.log('n4: ' + n);
        }
    } else
        loc = "FT";
    return {t: loc, n: n};
}

//verifica se um determinado id está na finger table
function inFT(id) {
    var foo = null;
    fingerTable.forEach(function (item, index, array) {
        if (item.id === id) {
            // console.log("found " + id + " in " + index + "   /" + item.id);
            foo = index;
        }
    });
    return foo;
}

//verifica se um determinado id está na tabela de peers temporários
function inTP(id) {
    tempPeers.forEach(function (item, index, array) {
        if (item.id === id)
            return index;
    });
    return null;
}

//verifica se um id preenche os parâmetros para estar na finger table
function checkFT(dest) {
    var newfinger = [];
    biid = bigInt(id, 16);
    bidest = bigInt(dest, 16);
    // console.log("id: " + biid.toString() + ", dest: " + bidest + ", m: " + m + ", 2^m:" + max.toString());
    for (var j = 1; j <= m; j++) {
        var aux = bigInt(2).pow(j - 1);
        //fi = bigInt(id, 16);
        //aux = aux.plus(bigInt(id, 16));
        var fi = biid.plus(aux);
        if (fi.greater(max))
            fi = fi.minus(max);

        if (typeof fingerTable[j - 1] !== 'undefined') {
            var biprev = bigInt(fingerTable[j - 1].id, 16);
            console.log("j:" + j + " /fi: " + fi.toString() + " /biprev: " + biprev.toString() + " /bidest: " + bidest.toString());
            // console.log("dest/fi/ft[j-1]: " + bigInt(dest, 16).toString() + " / " + fi.toString() + " / " + bigInt(fingerTable[j - 1].id, 16).toString());
            if ((bidest.greaterOrEquals(fi) && !bidest.greater(biprev)) ||
                (fi.greater(biprev) && biprev.greaterOrEquals(bidest) && biid.greater(bidest)) ||
                (bidest.greaterOrEquals(fi) && biid.greater(biprev) && bidest.greaterOrEquals(biprev)) ||
                (bidest.greaterOrEquals(fi) && fi.greater(biprev) && bidest.greater(biprev))) {

                newfinger.push(j - 1);
                if (j < 5) console.log("checkFT_ j d: " + j);
            }
        }
        else {
            if (j < 0) console.log("checkFT_ j u: " + j);
            newfinger.push(j - 1)
            //if(((j/m)*100)%10===0)
            //console.log("filling the table "+(j/m)*100+"%");
        }
        prev = j;
    }
    //console.log("new finger: " + newfinger);
    return newfinger;
}

//imprime a finger table na página
function printFT(event) {
    writeP("i / id / Signaling State / Data Channels (Send/Receive)/ 2^(i-1)")
    fingerTable.forEach(function (value, index) {

        writeP((index + 1) + "\t/ " + value.id + "\t/ " + value.pc.signalingState + "\t/ (" + value.sendChannel.readyState + /*"/" + value.receiveChannel.readyState + */") / " + value.i.toString());
    })
}

//calculates the value in the ith element of the finger table
function fingerIndex(i) {

    var aux = bigInt(2).pow(i);
    aux = bigInt(id, 16).plus(aux);
    if (aux.greater(max))
        aux = aux.minus(max);
    return aux;
}

//procura sucessor
function findKeySuccessor(key, source) {
    var bik = bigInt(key, 16);
    var biid = bigInt(id, 16);
    var bisuc = bigInt(fingerTable[0].id, 16);

    if ((bik.greater(biid) && bisuc.greaterOrEquals(bik) && bisuc.greater(biid)) ||
        (bik.greaterOrEquals(bisuc) && bik.greater(biid) && biid.greaterOrEquals(bisuc)) ||
        (bik.greater(biid) && bisuc.greaterOrEquals(bik) && biid.greater(bisuc))) {
        console.log("(key) succ!");
        return "succ";
    }
    for (var i = fingerTable.length - 1; i >= 0; i--) {
        var bif = bigInt(fingerTable[i].id, 16);
        if ((bik.greater(biid) && bif.greaterOrEquals(bik) && bif.greater(biid)) ||
            (bik.greaterOrEquals(bif) && bik.greater(biid) && biid.greaterOrEquals(bif)) ||
            (bik.greater(biid) && bif.greaterOrEquals(bik) && biid.greater(bif))) {
            console.log("sent findKsucc to finger " + i);
            fingerTable[i].sendChannel.send(JSON.stringify({
                "id": id,
                "type": "findKSucc",
                "key": key,
                "source": source
            }));
        }
    }
    return null;

}

function fkBtnHandler() {
    n = findKeySuccessor(inputKey.value, id);//.then(function (n) {
    if (n === "succ") {
        fingerTable[0].sendChannel.send(JSON.stringify({
            "type": "reqFile",
            "key": inputKey.value,
            "id": id
        }));
    }
    inputKey.value = "";
    // });
}

function stabilizeF() {
    if (fingerTable.length >= 1 && fingerTable[0].sendChannel !== undefined) {
        if (fingerTable[0].sendChannel.readyState === 'open') {
            fingerTable[0].sendChannel.send(JSON.stringify({"type": "stabilize", "id": id}));
        }
    }
}

function checkConn() {
    var fleg = false;
    fingerTable.forEach(function (value, index) {
        if (value.sendChannel.readyState === "connecting") {
            restartFinger(index);
            if (downList.indexOf(index)>=0) {
                i = downList.indexOf(index);
                downCount[i]++;
                if (downCount[i] > 5) {
                    fleg = true;
                    downList.splice(i, 1);
                    downCount.splice(i, 1);
                    if(i === 0){
                        fingerTable.shift();
                        newSucc(fingerTable[0].id);
                        connectTo(0);
                    } else {
                        fingerTable.splice(i, 1);
                    }
                }
            } else {
                downList.push(index);
                downCount.push(0);
            }
        } else if (downList.indexOf(index)>=0) {
            i = downList.indexOf(index);
            downList.splice(i, 1);
            downCount.splice(i, 1);
        }
    });
    if(fleg){
        fingerTable.forEach(function (value, index) {
            value.i = fingerIndex(index);
        })
    }
}

function restartFinger(i) {
    console.log("restarting finger No " + i);
    auxID = fingerTable[i].id;
    fingerTable[i] = newFTElement(fingerIndex(i), auxID);
    startUp(i, "ft");
    connectTo(i);
}

//Images Bigodes

function readmultifiles(files) {

    var ul = document.querySelector("#bag>ul");
    console.log(' ul in here ' + ul);
    while (ul.hasChildNodes()) {
        ul.removeChild(ul.firstChild);
    }

    function setup_reader(file) {
        var reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = function (e) {


            var bin = e.target.result; //get file content
            pic = bin;
            // do sth with text
            console.log('this size ' + bin.length);
            var li = document.createElement("li");
            li.innerHTML = bin;
            //ul.appendChild(li);
            document.getElementById("pre").src = bin;
        }
    }

    for (var i = 0; i < files.length; i++) {
        setup_reader(files[i]);
        console.log('this name of file ' + files[i].name);
        console.log('this file ' + i);
    }
}

function sendImg() {
    var ii = inputI2.value;
    var message = pic;
    console.log('message ' + message);
    fingerTable[ii - 1].sendChannel.send(JSON.stringify({"type": "img", "data": message, "id": id}));
    messageInputBox.value = "";
    messageInputBox.focus();
}

//outros
function isnewFinger(newid, oldid, fi) {
    aux;
}

function newFingerTable() {
    for (var i = 1; i <= m; i++) {
        fingerTable[i] = newFTElement(fingerIndex(i), 0);
    }
    console.log("FT ready");
}

function getIDfromPC(pc) {
    fingerTable.forEach(function (value, index) {
        if (fingerTable[index].pc === pc) {
            return index;
        }
    });
}


function logConnData(i) {
    console.log("id: " + fingerTable[i].id);
    console.log("SignalingState: " + fingerTable[i].pc.signalingState);
    console.log("ldesc / remdesc -> " + fingerTable[i].pc.localDescription + " / " + fingerTable[i].pc.remoteDescription);
    console.log("sendChannel state: " + fingerTable[i].sendChannel.readyState + " /sendChannel: " + fingerTable[i].sendChannel.readyState);
}


