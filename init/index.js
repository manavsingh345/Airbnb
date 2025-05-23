const mongoose = require("mongoose");
const initData = require("./data.js");
const Listing = require("../models/listing.js");
main().then(() => {
    console.log("connected to DB");
}).catch((err) => {
    console.log(err);
});

async function main() {
    await mongoose.connect("mongodb+srv://msingh42096:4zQRCjDhIo8Aszjl@cluster0.wjyc1wy.mongodb.net/wounderlust");
}

const initDB = async function () {
    await Listing.deleteMany({});
    initData.data = initData.data.map((obj) => ({ ...obj, owner: "682b4a01c817e0f70c6c0654" }))
    await Listing.insertMany(initData.data);

    console.log("data was initialized");
};
initDB();