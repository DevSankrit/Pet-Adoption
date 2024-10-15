const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv'); // Optional if you're using env variables
const User = require('./Model/model'); // Import the User model
const bcrypt = require('bcryptjs'); // For password hashing
const passport = require('passport'); // For user authentication
const LocalStrategy = require('passport-local').Strategy; // Passport local strategy
const session = require('express-session'); // For storing session cookies
const flash = require('connect-flash'); // For flash messages
const multer = require('./config/multer'); // Import multer config
const Pet = require('./Model/petmodel');  // Adjust the path as necessary
const petRoutes = require('./routes/petRoutes'); // Import pet routes
const Razorpay = require('razorpay');
const crypto = require('crypto');



// Import the pet controller
const addPetController = require('./servers/addPetController');

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize Razorpay instance
const razorpay = new Razorpay({
    key_id: 'YOUR_TEST_KEY_ID', // Replace with your Razorpay Test API Key
    key_secret: 'YOUR_TEST_KEY_SECRET', // Replace with your Razorpay Test API Secret
  });

app.set('view engine', 'ejs');  // Use EJS as the template engine

// Middleware
app.use(express.static("public")); // Serve static files (CSS, etc.)
app.use(express.urlencoded({ extended: true })); // Middleware to parse form data
app.use(express.json()); // Middleware to parse JSON
app.use(flash()); // Initialize flash messages
app.use(petRoutes);

// MongoDB connection
const MONGODB_URI = "mongodb://127.0.0.1:27017/petAdoption";
mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => {
    console.log('MongoDB connected');
}).catch(err => console.log('MongoDB connection error:', err));

// Session configuration
app.use(session({
    secret: 'secret', // Replace with environment variable
    resave: false,
    saveUninitialized: false,
   /* cookie: { 
        httpOnly: true, 
        secure: false, // Set to true if using https
        maxAge: 60 * 60 * 1000 // 1 hour expiry time for the cookie
    }, */
}));

// Passport.js configuration
passport.use(new LocalStrategy({ usernameField: 'email' }, async (email, password, done) => {
    try {
        const user = await User.findOne({ email });
        if (!user) {
            console.log("User not found with email:", email);
            return done(null, false, { message: 'No user found with that email' });
        }

        console.log("Entered password:", password);
        console.log("Stored hashed password:", user.password);

        const isMatch = await bcrypt.compare(password, user.password);
        console.log("Password match result:", isMatch);

        if (!isMatch) {
            return done(null, false, { message: 'Incorrect password' });
        }

        return done(null, user);
    } catch (error) {
        return done(error);
    }
}));


passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (error) {
        done(error);
    }
});

// Initialize Passport and session handling
app.use(passport.initialize());
app.use(passport.session());

// Middleware for checking if the user is authenticated
function checkAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/login');
}

// Routes
app.get("/login", (req, res) => {
    res.sendFile(__dirname + "/login.html");
});

app.get("/signup", (req, res) => {
    res.sendFile(__dirname + "/signup.html");
});

app.get("/dashboard", checkAuthenticated, (req, res) => {
    res.sendFile(__dirname + "/dashboard.html"); // Protected route
});

app.get('/success', (req, res) => {
    res.sendFile(__dirname + '/success.html');
});
app.get('/petslist', (req, res) => {
    res.sendFile(__dirname + '/petsList.html');
});

app.get('/addpet', checkAuthenticated, (req, res) => {
    res.sendFile(__dirname + '/addpet.html');
});

app.get('/adoptpet/:petId', async (req, res) => {
    const petId = req.params.petId;
    
    try {
        // Fetch the pet details from the MongoDB database using Mongoose
        const pet = await Pet.findById(petId);
        
        if (!pet) {
            return res.status(404).send('Pet not found');
        }
        
        // Render the adoptpet page with the specific pet's details
        res.render('adoptpet', { pet });  // Render the pet details page (make sure you have a view named 'adoptpet')
    } catch (error) {
        console.error('Error fetching pet details:', error);
        res.status(500).send('Internal Server Error');
    }
});



// Signup route
app.post('/signup', async (req, res) => {
    const { name, email, password } = req.body;

    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // No need to hash the password here, let the schema middleware handle it
        const newUser = new User({ name, email, password });
        await newUser.save();

        res.redirect('/success');
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


// Login route using Passport
app.post('/login', passport.authenticate('local', {
    successRedirect: '/dashboard',
    failureRedirect: '/login',
    failureFlash: true // Use flash messages for errors
}));

// Logout route
app.post('/logout', (req, res) => {
    req.logout((err) => {
        if (err) {
            return res.status(500).json({ message: 'Logout failed' });
        }
        res.redirect('/login');
    });
});



// Pet Add Route with File Handling using controller
app.post('/addpet', checkAuthenticated, multer.single('photo'), addPetController.addPet);

app.get('/managepets', async (req, res) => {
    try {
        // Fetch pets for the logged-in user
        const pets = await Pet.find({ owner: req.user._id });  // Assuming logged-in user has _id in the session
        // Render the managePets.ejs file and pass the pets data to it
        res.render('managepets', { pets });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

//for to aopt pet
app.post('/adoptpet/:petId', (req, res) => {
    const petId = req.params.petId;
    const { customerName, email, phone } = req.body;

    const newAdoption = new Adoption({
        customerName,
        email,
        phone,
        petId,
        paymentStatus: 'Pending', // Razorpay status
    });

    newAdoption.save((err, adoption) => {
        if (err) {
            return res.status(500).send('Error saving adoption details');
        }

        // Redirect to payment (next step is integrating Razorpay)
        res.redirect(`/payment/${adoption._id}`);
    });
});

// Route to create an order
app.post('/create-order', async (req, res) => {
    const { amount } = req.body; // Amount in INR (in paisa)
  
    const options = {
      amount: amount * 100, // Convert amount to paisa
      currency: 'INR',
      receipt: `receipt_order_${Date.now()}`,
      payment_capture: 1, // Auto capture
    };
  
    try {
      const order = await razorpay.orders.create(options);
      res.json({
        id: order.id,
        currency: order.currency,
        amount: order.amount,
      });
    } catch (error) {
      console.log(error);
      res.status(500).send('Error creating Razorpay order');
    }
  });

  app.post('/razorpay-webhook', express.json(), async (req, res) => {
    const webhookSecret = 'YOUR_WEBHOOK_SECRET'; // Replace with your webhook secret

    // Verify the webhook signature
    const shasum = crypto.createHmac('sha256', webhookSecret);
    shasum.update(JSON.stringify(req.body));
    const digest = shasum.digest('hex');

    if (digest !== req.headers['x-razorpay-signature']) {
        return res.status(400).send('Webhook signature verification failed');
    }

    // Extract the payment details
    const { event, payload } = req.body;
    if (event === 'payment.captured') {
        const paymentId = payload.payment.entity.id;
        const adoptionId = payload.payment.entity.receipt;

        try {
            // Find the adoption by its ID and update the payment status
            const adoption = await Adoption.findById(adoptionId);
            if (!adoption) {
                return res.status(404).send('Adoption record not found');
            }

            adoption.paymentStatus = 'Success';
            await adoption.save();

            // Send response back to Razorpay
            res.status(200).send('Webhook received and processed successfully');
        } catch (error) {
            console.error('Error updating adoption record:', error);
            res.status(500).send('Internal Server Error');
        }
    } else {
        // Ignore other events
        res.status(200).send('Event ignored');
    }
});



// Start the server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
