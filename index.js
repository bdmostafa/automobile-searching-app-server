const express = require("express");
const app = express();
const { MongoClient } = require("mongodb");
const bodyParser = require("body-parser");
const cors = require("cors");
const uploadFile = require("express-fileupload");
require("dotenv").config();
const { ObjectId } = require("mongodb");

const port = 5000;

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors());
app.use(uploadFile());

const uri =
  `mongodb+srv://${process.env.DB_USER}:${process.env.USER_PASS}@cluster0.qlvoh.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  useUnifiedTopology: true,
  useNewUrlParser: true,
});

client.connect((err) => {

  const carsCollection = client.db(process.env.DB_NAME).collection(process.env.DB_COLLECTION_CARS);

  console.log("data base connected");
  // Function to process request data with file system
  const loadRequestedData = (req) => {
    const file = req.files.file;
    const newImg = file.data;
    const encodedImg = newImg.toString("base64");

    const image = {
      contentType: file.mimetype,
      size: file.size,
      img: Buffer.from(encodedImg, "base64"),
    };

    const totalData = JSON.parse(req.body.total);
    totalData.img = image;
    return totalData;
  };

  // API for adding new car by users
  app.post("/add-car", (req, res) => {
    const newCar = loadRequestedData(req);

    carsCollection.insertOne(newCar).then((result) => {

      res.send({ id: result.insertedId, result: result.insertedCount > 0 });
    });
  });

  // API for getting all available cars
  app.get("/cars", (req, res) => {
    carsCollection.find({}).toArray((err, cars) => {
      res.send(cars);
    });
  });

  // API for updating car details by user
  app.patch("/update-car/", (req, res) => {

    const updatedCar = loadRequestedData(req);

    const {
      _id,
      name,
      features,
      km,
      manual,
      bestSeller,
      color,
      petrol,
      price,
      reviews,
      sport,
      star,
      year,
      img: { img: img },
    } = updatedCar;

    carsCollection
      .updateOne(
        { _id: ObjectId(_id) },
        {
          $set: {
            name,
            features,
            km,
            manual,
            bestSeller,
            color,
            petrol,
            price,
            reviews,
            sport,
            star,
            year,
            img,
          },
        }
      )
      .then((result) => {
        res.send(result.modifiedCount > 0);
      });
  });

  // Delete a car API
  app.delete("/delete-car", (req, res) => {
    carsCollection
      .deleteOne({ _id: ObjectId(req.headers._id) })
      .then((result) => {
        res.send(result.deletedCount > 0);
      });
  });
});

app.get("/", (req, res) => {
  res.send("Hello Automobile Searching App!");
});

app.listen(process.env.PORT || port);
