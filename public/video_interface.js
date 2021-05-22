/*jslint browser: true*/

/*global console, alert, $, jQuery*/

let socket = io('/video')
let FReader = null
let Name = null
let selectedFile = null
const bar = document.getElementsByClassName("progress-bar")[0];
document.getElementById('UploadButton').addEventListener('click', StartUpload);
document.getElementById('FileBox').addEventListener('change', FileChosen);
checkBroswerSupport()

function checkBroswerSupport() {
    bar.style = `--progress: ${0}`;
    window.addEventListener("load", Ready);

    function Ready() {
        if (window.File && window.FileReader) { //These are the relevant HTML5 objects that we are going to use 
            console.log('ready');
        } else {
            document.getElementById('UploadArea').innerHTML = "Your Browser Doesn't Support The File API Please Update Your Browser";
        }
    }
}


socket.on('more-data', function (data) {
    console.log(data);
    let percentage = Math.floor(data['Percent'])
    updateProgressBar(percentage);
    var Place = data['Place'] * 524288; //The Next Blocks Starting Position
    let NewFile; //The Variable that will hold the new Block of Data
    if (selectedFile.webkitSlice) {
        NewFile = selectedFile.webkitSlice(Place, Place + Math.min(524288, (selectedFile.size - Place)));
    }
    else {
        NewFile = selectedFile.slice(Place, Place + Math.min(524288, (selectedFile.size - Place)));
    }
    console.log('here');
    FReader.readAsBinaryString(NewFile);
});
socket.on('Done', function (data) {
    $('#cancelButton').addClass('none')
    submitVideo(data)
});



function updateProgressBar(percent) {
    if (percent >= 0.45) {
        $('.box p').addClass('c-b')
    }
    bar.style = `--progress: 00.${percent}`;
    document.getElementById('percent').innerHTML = (Math.round(percent * 100) / 100);
    var MBDone = Math.round(((percent / 100.0) * selectedFile.size) / 1048576);
    $('#mb').html(MBDone);
}


function FileChosen(evnt) {
    console.log('FileChosen');
    selectedFile = evnt.target.files[0];
    document.getElementById('NameBox').value = selectedFile.name;
    $("<div class='file__value'><div class='file__value--text'>" + evnt.target.files[0].name + "</div><div class='file__value--remove' data-id='" + evnt.target.files[0].name + "' ></div></div>").insertAfter('#file__input');
    $('.mb').html("<span id='Uploaded'> <span id='mb'>0</span>/" + Math.round(selectedFile.size / 1048576) + "MB</span>")

}


function StartUpload(e) {
    console.log('twic');
    if (document.getElementById('FileBox').value === "") {
        return alert("Please Select A File");
    }

    $('#UploadButton').off('click');
    // console.log('upload started');

    $('.video-title').addClass('none')
    $('.video-input').addClass('none')
    $('#UploadButton').addClass('none')
    $('#cancelButton').removeClass('none')
    FReader = new FileReader();
    Name = document.getElementById('NameBox').value;


    FReader.onload = function (evnt) { socket.emit('upload', { 'Name': Name, Data: evnt.target.result }) }
    socket.emit('start', { 'Name': Name, 'Size': selectedFile.size });


}
async function submitVideo(info) {
    bar.classList.add("done");
    bar.style = `--progress: 1`;
    $('.file__value').remove()
    window.location.href = '/'
}



//Click to remove item
$('body').on('click', '.file__value', function () {
    $(this).remove();
    $('.mb').html("<span id='Uploaded'> <span id='mb'>0</span>/0 MB</span>")

});