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
const crypto = require('crypto');
const paytmConfig = require('./config/paytmconfig');
const PaytmChecksum = require('paytmchecksum');
const request = require('request');
const Adoption = require('./Model/adoption'); // Adjust the path based on your file structure
const router = express.Router();
const { deletePet } = require('./servers/addPetController');



// Import the pet controller
const addPetController = require('./servers/addPetController');

const app = express();
const PORT = process.env.PORT || 5000;  

app.set('view engine', 'ejs');  // Use EJS as the template engine

// Middleware
app.use(express.static("public")); // Serve static files (CSS, etc.)
app.use(express.urlencoded({ extended: true })); // Middleware to parse form data
app.use(express.json()); // Middleware to parse JSON
app.use(flash()); // Initialize flash messages
app.use(petRoutes);
app.use('/uploads', express.static('uploads'));

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
    cookie: { 
        httpOnly: true, 
        secure: false, // Set to true if using https
        maxAge: 60 * 60 * 1000 // 1 hour expiry time for the cookie
    },
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

app.get("/dashboard", checkAuthenticated, async (req, res) => {
    try {
        const petOwnerId = req.user._id; // Assuming req.user contains the authenticated user
        const adoptions = await Adoption.find({ petOwnerId }).populate('petId').exec(); // Populate pet details
        
        res.render("dashboard", { adoptions });
    } catch (err) {
        console.error("Error loading dashboard:", err);
        res.status(500).send('Error loading dashboard');
    }
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
app.get('/report', checkAuthenticated, (req, res) => {
    res.sendFile(__dirname + '/report.html');
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

//deleteing the pet
app.delete('/deletepet/:petId', async (req, res) => {
    try {
      const petId = req.params.petId;
      
      // Use await to delete the pet and handle the promise
      const deletedPet = await Pet.findByIdAndDelete(petId);
  
      if (!deletedPet) {
        return res.status(404).send('Pet not found'); // If the pet was not found in the database
      }
  
      res.status(200).send('Pet deleted successfully');
    } catch (error) {
      console.error(error);
      res.status(500).send('Error deleting the pet');
    }
  });
  

module.exports = router;



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

//manage pets
app.get('/managepets', checkAuthenticated, async (req, res) => {
    try {
        // Fetch pets for the authenticated user
        const pets = await Pet.find({ owner: req.user._id });
        res.render('managepets', { pets });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

//to adopt a pet
app.post('/adoptpet/:petId', async (req, res) => {
    const petId = req.params.petId;
    const { customerName, email, phone } = req.body;

    try {
        // Find the pet and its owner to link with the adoption
        const pet = await Pet.findById(petId).populate('owner'); // Assuming pet has an owner field
        if (!pet) {
            return res.status(404).json({ success: false, message: 'Pet not found' });
        }

        const newAdoption = new Adoption({
            customerName,
            email,
            phone,
            petId,
            petOwnerId: pet.owner._id, // Store the owner of the pet
            paymentStatus: 'Pending',
        });

        const adoption = await newAdoption.save(); // Save with async/await

        // Prepare Paytm payment details
        const paymentDetails = {
            'MID': paytmConfig.MID,
            'WEBSITE': paytmConfig.WEBSITE,
            'INDUSTRY_TYPE_ID': paytmConfig.INDUSTRY_TYPE_ID,
            'CHANNEL_ID': paytmConfig.CHANNEL_ID,
            'ORDER_ID': adoption._id.toString(), // Use adoption ID as the order ID
            'CUST_ID': email,
            'TXN_AMOUNT': '100.00',
            'CALLBACK_URL': paytmConfig.CALLBACK_URL,
            'EMAIL': email,
            'MOBILE_NO': phone
        };

        // Generate Paytm checksum
        PaytmChecksum.generateSignature(paymentDetails, paytmConfig.KEY).then(function(checksum) {
            paymentDetails.CHECKSUMHASH = checksum;

            const postParams = {
                uri: 'https://securegw-stage.paytm.in/theia/processTransaction',
                method: 'POST',
                json: paymentDetails
            };

            // Request to Paytm for transaction
            request(postParams, function(error, response, body) {
                if (error) {
                    return res.status(500).json({ success: false, message: 'Error creating Paytm order' });
                } else {
                    const paymentUrl = `https://securegw-stage.paytm.in/order/process?ORDER_ID=${paymentDetails.ORDER_ID}`;
                    res.json({ success: true, paymentUrl });
                }
            });
        }).catch(function(error) {
            console.log('Error generating checksum:', error);
            res.status(500).json({ success: false, message: 'Error generating checksum' });
        });

    } catch (error) {
        return res.status(500).json({ success: false, message: 'Error saving adoption details' });
    }
});



app.post('/payment/callback', async (req, res) => {
    const body = req.body;
    const checksum = body.CHECKSUMHASH;

    // Verify checksum
    if (PaytmChecksum.verifySignature(body, paytmConfig.KEY, checksum)) {
        const { ORDERID, TXNID, TXNAMOUNT, STATUS, RESPCODE, RESPMSG } = body;

        // Find the adoption record using ORDERID (which is the _id of adoption)
        try {
            const adoption = await Adoption.findById(ORDERID);

            if (!adoption) {
                return res.status(404).send('Adoption record not found');
            }

            if (STATUS === 'TXN_SUCCESS') {
                // Update the payment status to 'Success'
                adoption.paymentStatus = 'Success';
                await adoption.save(); // Save the updated adoption status

                res.status(200).send('Payment successful and adoption process updated.');
            } else {
                // Payment failed
                res.status(400).send(`Payment failed: ${RESPMSG}`);
            }
        } catch (error) {
            res.status(500).send('Error updating adoption record');
        }
    } else {
        res.status(400).send('Checksum verification failed');
    }
});


app.post('/create-order', (req, res) => {
    const { amount } = req.body; // Amount in INR

    const paymentDetails = {
        'MID': paytmConfig.MID,
        'WEBSITE': paytmConfig.WEBSITE,
        'INDUSTRY_TYPE_ID': paytmConfig.INDUSTRY_TYPE_ID,
        'CHANNEL_ID': paytmConfig.CHANNEL_ID,
        'ORDER_ID': `ORDER_${new Date().getTime()}`,
        'CUST_ID': 'CUSTOMER_ID_HERE', // Provide a unique customer ID
        'TXN_AMOUNT': amount,
        'CALLBACK_URL': paytmConfig.CALLBACK_URL,
        'EMAIL': 'customer_email@example.com',
        'MOBILE_NO': 'customer_phone_number'
    };

    PaytmChecksum.generateSignature(paymentDetails, paytmConfig.KEY).then(function(checksum) {
        paymentDetails.CHECKSUMHASH = checksum;

        const postParams = {
            uri: 'https://securegw-stage.paytm.in/theia/processTransaction',
            method: 'POST',
            json: paymentDetails
        };

        request(postParams, function(error, response, body) {
            if (error) {
                return res.status(500).send('Error creating Paytm order');
            } else {
                res.json({
                    id: paymentDetails.ORDER_ID,
                    currency: 'INR',
                    amount: amount * 100 // Amount in paisa
                });
            }
        });
    }).catch(function(error) {
        console.log('Error generating checksum:', error);
        res.status(500).send('Error generating checksum');
    });
});




// Start the server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
