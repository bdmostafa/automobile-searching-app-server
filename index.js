const express = require('express');
const app = express();
const { MongoClient } = require('mongodb');
const bodyParser = require('body-parser');
const cors = require('cors');
const uploadFile = require('express-fileupload');
require('dotenv').config();
const { ObjectID } = require('mongodb');

const port = 5000;

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors());
app.use(uploadFile());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.USER_PASS}@cluster0.efifc.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;

const client = new MongoClient(
    uri,
    {
        useUnifiedTopology: true,
        useNewUrlParser: true
    }
);

client.connect(err => {

    const carsCollection = client.db(process.env.DB_NAME).collection(process.env.DB_COLLECTION_CARS);

    console.log("data base connected");
    // Function to process request data with file system
    const loadRequestedData = (req) => {

        const file = req.files.file;
        const newImg = file.data;
        const encodedImg = newImg.toString('base64');

        const image = {
            contentType: file.mimetype,
            size: file.size,
            img: Buffer.from(encodedImg, 'base64')
        };

        const totalData = JSON.parse(req.body.total)
        totalData.img = image;
        return totalData;
    }

    // API for adding new service by admins
    app.post('/add-car', (req, res) => {

        const newCar = loadRequestedData(req);

        carsCollection.insertOne(newCar)
            .then(result => {
                res.send(result.insertedCount > 0);
            })
    })

    // API for getting all available cars
    app.get('/cars', (req, res) => {

        carsCollection.find({})
            .toArray((err, cars) => {
                res.send(cars);
            })
    })


    // API for updating status of an order by admin
    app.patch('/update-car', (req, res) => {

        carsCollection.updateOne({ _id: ObjectID(req.headers.id) }, {
            $set: { status: req.body.status }
        })
            .then(result => {
                res.send(result.modifiedCount > 0)
            })
    })
});

app.get('/', (req, res) => {
    res.send('Hello Automobile Searching App!')
})

app.listen(process.env.PORT || port);