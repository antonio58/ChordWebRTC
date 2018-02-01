var pendingFiles = [];
var tempFiles;
var myIndex = 0;
var carouselCount = 0;
var getFileCount = 0;
var carousel;
var maxFiles = 5;
var carouselOff = true;
var shownFiles = [];

function readmultifiles(files) {

    var ul = document.querySelector("#bag>ul");
    while (ul.hasChildNodes()) {
        ul.removeChild(ul.firstChild);
    }

    function setup_reader(file, j) {
        var reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = function (e) {
            var bin = e.target.result; //get file content
            caralho = bin;
            pendingFiles.forEach(function (value, index) {
                // console.log("pendingfile ("+j+")"+JSON.stringify(value));
                if (value.i === j) {
                    // console.log("pushing raw ::"+bin);
                    value.raw = bin;
                }
                if (value.raw === "nope") {
                    pendingFiles.splice(index, 1);
                    console.log("upload failed");
                }
            });
            // do sth with text
            // console.log('this size ' + bin.length);
            //var li = document.createElement("li");
            //li.innerHTML = bin;
            //ul.appendChild(li);
            //document.getElementById("preview").src = bin;
        }
    }

    for (var i = 0; i < files.length; i++) {
        console.log('file: ' + files[i].name);
        // console.log('this file ' + i);
        pendingFiles.push({name: files[i].name, i: i, raw: "nope"});
        setup_reader(files[i], i);
    }


}

function uploadFile() {
    pendingFiles.forEach(function (value, index) {
        if (value.raw !== "nope") {
            console.log("asking fileID");
            serverConnection.send(JSON.stringify({type: "fileID", name: value.name, i: value.i, id: id}))
        }
    });
    inputI4.setAttribute("max", localStorage.length);
}

function setImg() {
    var i = inputI4.value;
    console.log("setting img " + i);
    document.getElementById('preview').src = JSON.parse(localStorage.getItem(localStorage.key(i - 1))).raw;
    document.getElementById('previewName').innerHTML = (JSON.parse(localStorage.getItem(localStorage.key(i - 1))).name) + " / " + localStorage.key(i - 1);
}

function sendImg() {
    var ii = inputI2.value;
    var message = pic;
    console.log('message ' + message);
    fingerTable[ii - 1].sendChannel.send(JSON.stringify({"type": "img", "data": message, "id": id}));
    messageInputBox.value = "";
    messageInputBox.focus();
}

function startCarousel() {

    if(carouselCount<0)
        carouselCount=0;

    if (localStorage.length >= maxFiles) {
        console.log("ls i:"+carouselCount+", k: "+localStorage.key(carouselCount));
        if (!ownFile(localStorage.key(carouselCount)) && shownFiles.includes(localStorage.key(carouselCount))) {
            localStorage.removeItem(localStorage.key(carouselCount));
        }
    }

    var flig = true;
    do {
        if (getFileCount >= fileList.length) {
            getFileCount = 0;
            flig = false;
        }
        if (shownFiles.includes(fileList[getFileCount])){
            getFileCount++;
        } else
            flig = false;
    }while(flig);

        flug = true;
    for (i = 0; i < localStorage.length; i++) {
        if (fileList[getFileCount] === localStorage.key(i))
            flug = false;
    }
    if (flug) {
        console.log("carousel getting file: " + fileList[getFileCount]);
        n = findKeySuccessor(fileList[getFileCount], id);
        if (n === "succ") {
            console.log("!");
            fingerTable[0].sendChannel.send(JSON.stringify({
                "type": "reqFile",
                "key": key,
                "id": id
            }));
        }
        else if (n === "pending") {
            pendingFinds.push({type: "req", source: id, key: fileList[getFileCount], id: id});
        }
    }

    getFileCount++;


    if (localStorage.length > 0) {
        carouselCount--;
        var fleg = true;
        do {
            if (carouselCount > localStorage.length - 1) {
                shownFiles = [];
                carouselCount = 0;
                fleg = false
            }
            if (shownFiles.includes(localStorage.key(carouselCount)) || carouselCount<0) {
                carouselCount++;
            } else {
                fleg = false;
            }
        } while (fleg);
        shownFiles.push(localStorage.key(carouselCount));
        // console.log("carouseling "+carouselCount);
        document.getElementById('carousel').src = JSON.parse(localStorage.getItem(localStorage.key(carouselCount))).raw;
        document.getElementById('carouselName').innerHTML = (JSON.parse(localStorage.getItem(localStorage.key(carouselCount))).name) + " / " + localStorage.key(carouselCount);
    }
}

function changeCarouselStatus(start) {
    if (start && carouselOff) {
        carouselOff = false;
        carousel = setInterval(startCarousel, 2000);
    } else if (!start && !carouselOff) {
        carouselOff = true;
        clearInterval(carousel);
    }
}

