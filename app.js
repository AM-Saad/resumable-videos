const path = require("path");

const express = require("express");
const bodyParser = require("body-parser");
const fs = require("fs");
const cors = require("cors");

const { exec } = require('child_process');

const app = express();

// const server = app.listen(process.env.PORT || 3000);
var http = require('http').Server(app);

const io = require('./socket').init(http)
console.log('connected');


io.of('/video').on("connection", socket => {

    console.log(socket.id);

    // SocketEvent.load_upload_video(socket)

    let Files = {};

    socket.on('start', function (data) {
        console.log('starting');
        var name = data['Name'];
        Files[name] = {
            FileSize: data['Size'],
            Data: "",
            Downloaded: 0
        }
        var Place = 0;
        try {
            var Stat = fs.statSync(__dirname + '/temp/' + name);
            if (Stat.isFile()) {
                Files[name]['Downloaded'] = Stat.size;
                Place = Stat.size / 524288;
                console.log('eh');
            }
        }
        catch (err) {
            console.log(err);
        } //It's a New File
        fs.open(__dirname + "/temp/" + name, "a", 0755, function (err, fd) {
            if (err) {

                console.log(err);
            }
            else {
                Files[name]['Handler'] = fd; //We store the file handler so we can write to it later
                socket.emit('more-data', { 'Place': Place, Percent: 0 });
            }
        });
    })
    socket.on('upload', function (data) {

        console.log('start Uploading');

        var Name = data['Name'];

        Files[Name]['Downloaded'] += data['Data'].length;
        Files[Name]['Data'] += data['Data'];
        if (Files[Name]['Downloaded'] == Files[Name]['FileSize']) //If File is Fully Uploaded
        {
            console.log('1');

            fs.write(Files[Name]['Handler'], Files[Name]['Data'], null, 'Binary', function (err, Writen) {
                var inp = fs.createReadStream(__dirname + "/temp/" + Name);
                var out = fs.createWriteStream(__dirname + "/videos/" + Name);
                inp.pipe(out);
                inp.on("end", function () {
                    // Operation done
                    fs.unlinkSync(__dirname + "/temp/" + Name);
                    socket.emit('Done', { 'Image': 'videos/' + Name + '.jpg', path: "videos/" + Name });
                });

            });
        }
        else if (Files[Name]['Data'].length > 10485760) { //If the Data Buffer reaches 10MB
            console.log(2);
            fs.write(Files[Name]['Handler'], Files[Name]['Data'], null, 'Binary', function (err, Writen) {
                if (err) {
                    console.log(err);
                }
                Files[Name]['Data'] = ""; //Reset The Buffer
                var Place = Files[Name]['Downloaded'] / 524288;
                var Percent = (Files[Name]['Downloaded'] / Files[Name]['FileSize']) * 100;
                socket.emit('more-data', { 'Place': Place, 'Percent': Percent });
            });

            return Files
        } else {
            console.log(3);
            var Place = Files[Name]['Downloaded'] / 524288;
            var Percent = (Files[Name]['Downloaded'] / Files[Name]['FileSize']) * 100;
            socket.emit('more-data', { 'Place': Place, 'Percent': Percent });
            return Files

        }
    })

    socket.on('disconnect', function (data) {
        console.log(socket.id + " disconnected");
    });
});



app.set("view engine", "ejs");
app.set("views", "views");

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use('/videos', express.static(path.join(__dirname, 'videos')));
app.use('/temp', express.static(path.join(__dirname, 'temp')));
app.use(express.static(path.join(__dirname, "public")));


app.set('socketio', io);
app.use(cors()) // Use this after the variable declaration


app.get('/', (req, res, next) => {

    let files = []
    try {
        const rp = process.cwd()
        console.log(rp + '/videos');
        fs.readdirSync(rp + '/videos').forEach(file => files.push(file));

        return res.render('index', {
            files: files
        })
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        next(error);
    }
})




let port = process.env.PORT || 3000

http.listen(port, function () {
    console.log('listening on *:80');
});
