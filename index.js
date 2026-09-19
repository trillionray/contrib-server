require("dotenv").config(); 

const express = require("express");
const mongoose = require("mongoose");
// cross origin resource sharing 
const cors = require("cors");

const session = require("express-session");

const userRoutes = require("./routes/user");
const contributionRoutes = require("./routes/contribution");
// const itemRoutes = require("./routes/item");
// const cartRoutes = require("./routes/cart");
// const orderRoutes = require("./routes/order");
// const repairRoutes = require("./routes/repair");
// const session = require("express-session")

const app = express();


const corsOptions = {
	origin: [],
	credentials: true,
	optionsSuccessStatus: 200
}

app.use(cors())

// setup express session

// this will act as the storage especially for our user object
// app.use(session({
// 	secret: process.env.GOOGLE_CLIENT_SECRET,
// 	resave: false,
// 	saveUninitialized: false
// }))

// app.use(passport.initialize());
// app.use(passport.session());
// -------

mongoose.connect(process.env.MONGODB_STRING);
let db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error"));
db.once("open", ()=> console.log("We're connected to the cloud database"));

app.use(express.json());
// app.use(express.urlencoded({extended:true}));


app.use("/users", userRoutes);
app.use("/contributions", contributionRoutes);
// app.use("/items", itemRoutes);
// app.use("/carts",cartRoutes);
// app.use("/orders", orderRoutes);
// app.use("/repairs", repairRoutes);

if(require.main == module){
	app.listen(process.env.PORT || 4000, () => console.log(`Server is running at port ${process.env.PORT || 3000}`));
}

module.exports = {app, mongoose}