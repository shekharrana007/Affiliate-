require('dotenv').config(); // Load environment variables from .env file
const express = require('express'); // express module included
const cookieParser = require('cookie-parser'); // cookie-parser module included
const cors = require('cors');  // CORS module included to handle cross-origin requests
const authRoutes = require('./src/routes/authRoutes'); // importing authRoutes
const mongoose = require('mongoose'); // Mongoose module included for MongoDB interaction
const userRoutes = require('./src/routes/userRoutes');
const paymentRoutes = require('./src/routes/paymentRoutes');
const linksRoutes = require('./src/routes/linksRoutes');

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('Database connected'))
    .catch(error => console.log(error)); // Connecting to MongoDB using Mongoose

const app = express(); // instance of express application
// We want to skip applying json middleware to webhook endpoint
app.use((request, response, next) => {
    if (request.originalUrl.startsWith('/payments/webhook')) {
        return next();
    }
    express.json()(request, response, next);
});
app.use(cookieParser()); // Middleware to parse cookies

const corsOptions = {
    origin: process.env.CLIENT_ENDPOINT, // Allow requests from the client endpoint specified in .env file
    credentials: true, // Allow cookies to be sent with requests
};
app.use(cors(corsOptions)); // Using CORS middleware with specified options

app.use('/auth', authRoutes); // Mounting authRoutes on /auth path
app.use('/links', linksRoutes);
app.use('/users', userRoutes);
app.use('/payments', paymentRoutes);

const PORT =process.env.PORT|| 5000;
app.listen(PORT, (error) => {
    if (error) {
        console.log("Error in starting server", error);
    } else {
        console.log("Server is running on port 5000");
    }
});
