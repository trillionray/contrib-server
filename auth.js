const jwt = require("jsonwebtoken");

require("dotenv").config();
    		// result ------------> user
module.exports.createAccessToken = (user) => {

	// payload
	console.log("creating payload...")
	const data = {
		id: user._id,
		email: user.email,
		isAdmin: user.isAdmin
	}
	console.log(data);

	return jwt.sign(data, process.env.JWT_SECRET_KEY, {})
}


module.exports.verify = (req, res, next) => {

	// console.log(req.headers.authorization) // this is where we store our token
	let token = req.headers.authorization; // gets the token from the request authorization 

	if(typeof token === "undefined"){
		return res.status(401).send({auth: "Failed. No Token"});
	}
	else{
		// console.log("before slice >>" + token);

		// to make it purely token without the 'Bearer '
		token = token.slice(7, token.length);
		// console.log("after slice >>" + token);

				// token, secretkey, function(err, decodedToken)
		jwt.verify(token, process.env.JWT_SECRET_KEY, function(err, decodedToken){
			if(err){
				return res.status(403).send({
					auth: "Failed",
					message: err.message
				})
			}
			else{
				req.user = decodedToken;
				// req.user = {
				//   "id": "6a50a433f5225ef998116589",
				//   "email": "jd@mail,com",
				//   "isAdmin": false
				// }

				// next middle ware
				// sends the req, and res to next process or function
				next();
			}
		})
	}
}

module.exports.verifyAdmin = (req, res, next) => {
	console.log(req.user)
	if(req.user.isAdmin == true){
		next();
	}
	else{
		return res.status(403).send({
			auth: "Failed",
			message: "Action Forbidden"
		})
	}
}

module.exports.errorHandler  = (err, req, res, next) => { 
	
	const statusCode = err.status || 500;
	const errorMessage = err.message || "Internal Server Error";

	return res.status(statusCode).json({
		error: {
			message: errorMessage,
			errorCode: err.code || "SERVER_ERROR",
			details: err.details|| null
		}
	});

	// let formattedError = {
	// 	error: {
	// 		message: errorMessage,
	// 		errorCode: err.code || "SERVER_ERROR",
	// 		details: err.details|| null
	// 	}
	// }

	// if(formattedError.error.message.includes("Course validation failed")){
	// 	return res.status(400).send("You need to check your required fields if it has inputs / values, or check also your request field names")
	// }
	// else{
	// 	return res.json(formattedError)
	// }
	
}


module.exports.isLoggedIn = (req, res, next) => {
	if(req.user){
		next();
	}
	else{
		res.sendStatus(401);
	}

}
