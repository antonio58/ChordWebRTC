var pendingFiles = [];
var caralho;

function readmultifiles(files) {

    var ul = document.querySelector("#bag>ul");
    console.log(' ul in here ' + ul);
    while (ul.hasChildNodes()) {
        ul.removeChild(ul.firstChild);
    }

    function setup_reader(file, j) {
        var reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = function (e) {


            var bin = e.target.result; //get file content
            caralho = bin;
            pendingFiles.forEach(function (value) {
                // console.log("pendingfile ("+j+")"+JSON.stringify(value));
                if(value.i === j){
                    // console.log("pushing raw ::"+bin);
                    value.raw = bin;
                }
            });

            // do sth with text
            // console.log('this size ' + bin.length);
            var li = document.createElement("li");
            li.innerHTML = bin;
            //ul.appendChild(li);
            //document.getElementById("preview").src = bin;
        }
    }

    for (var i = 0; i < files.length; i++) {
        console.log('this name of file ' + files[i].name);
        console.log('this file ' + i);
        pendingFiles.push({name:files[i].name, i:i, raw:"nope"});
        setup_reader(files[i], i);
    }

    pendingFiles.forEach(function (value) {
        console.log("asking fileID");
       serverConnection.send(JSON.stringify({type:"fileID", name:value.name, i:value.i, id:id}))
    });
}

function sendImg() {
    var ii = inputI2.value;
    var message = pic;
    console.log('message ' + message);
    fingerTable[ii - 1].sendChannel.send(JSON.stringify({"type": "img", "data": message, "id": id}));
    messageInputBox.value = "";
    messageInputBox.focus();
}
