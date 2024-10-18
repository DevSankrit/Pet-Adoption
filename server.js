const express = require('express');
const mongoose = require('mongoose');
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
const paypal = require('./config/paypal'); // PayPal configuration file
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



app.get('/', (req, res) => {
    res.sendFile(__dirname + '/Static Frontend/index.html');
});
app.get('/about', (req, res) => {
    res.sendFile(__dirname + '/Static Frontend/about.html');
});
app.get('/blog', (req, res) => {
    res.sendFile(__dirname + '/Static Frontend/blog.html');
});
app.get('/booking', (req, res) => {
    res.sendFile(__dirname + '/Static Frontend/booking.html');
});
app.get('/contact', (req, res) => {
    res.sendFile(__dirname + '/Static Frontend/contact.html');
});
app.get('/service', (req, res) => {
    res.sendFile(__dirname + '/Static Frontend/service.html');
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

// Adopt a pet with PayPal payment integration
app.post('/adoptpet/:petId', async (req, res) => {
    const petId = req.params.petId;
    const { customerName, email, phone } = req.body;

    try {
        // Find the pet details to retrieve the pet owner's ID
        const pet = await Pet.findById(petId);
        if (!pet) {
            return res.status(404).send('Pet not found');
        }

        const petOwnerId = pet.owner;
        if (!petOwnerId) {
            return res.status(400).send('Pet owner not found');
        }

        console.log("Creating new adoption for petId:", petId);
        
        // Save adoption details to the database, including the petOwnerId
        const newAdoption = new Adoption({
            customerName,
            email,
            phone,
            petId,
            petOwnerId, // Add the pet owner ID here
            paymentStatus: 'Pending',
        });

        const adoption = await newAdoption.save();
        console.log("Adoption saved:", adoption);

        // Create PayPal order using paypal.orders.OrdersCreateRequest
        const request = new paypal.orders.OrdersCreateRequest();
        request.prefer("return=representation");
        request.requestBody({
            intent: 'CAPTURE',
            purchase_units: [{
                reference_id: adoption._id.toString(),
                amount: {
                    currency_code: 'USD',
                    value: '100.00' // Amount you want to charge (change to your currency and amount)
                }
            }],
            application_context: {
                return_url: `http://localhost:5000/payment/success/${adoption._id}`, // PayPal will redirect here after payment
                cancel_url: `http://localhost:5000/payment/cancel/${adoption._id}` // Redirect here if payment is canceled
            }
        });

        const order = await paypal.client.execute(request);  // Use client.execute to send the request
        console.log("Order created:", order);

        if (!order.result.links || order.result.links.length === 0) {
            throw new Error("No approval link found in PayPal response.");
        }

        const approvalUrl = order.result.links.find(link => link.rel === 'approve').href;
        console.log("PayPal approval URL:", approvalUrl);

        // Send PayPal approval URL to the client
        res.json({ success: true, approvalUrl });
    } catch (error) {
        console.error('Error processing payment: ', error);
        res.status(500).json({ success: false, message: 'Error saving adoption details' });
    }
});

// Payment success route
app.get('/payment/success/:adoptionId', async (req, res) => {
    const { token } = req.query; // PayPal provides token in the query parameters
    const { adoptionId } = req.params; // Adoption ID from URL

    try {
        console.log("Capturing payment for token:", token);

        // Capture the payment
        const request = new paypal.orders.OrdersCaptureRequest(token);
        request.requestBody({});
        const capture = await paypal.client.execute(request);
        console.log("Payment captured:", capture);

        // Check if the payment is successful
        if (capture.result.status === 'COMPLETED') {
            console.log("Payment completed successfully.");

            // Update adoption payment status in the database to 'Success'
            await Adoption.findByIdAndUpdate(adoptionId, {
                paymentStatus: 'Success',
                paymentDetails: capture.result // Save relevant payment details
            });
            console.log("Adoption status updated to Success for:", adoptionId);
        } else {
            console.error("Payment not completed, status:", capture.result.status);
            return res.status(400).send('Payment failed.');
        }

        // Respond to client
        res.status(200).send('Payment successful! Adoption process completed.');
    } catch (error) {
        console.error('Error capturing payment: ', error);
        res.status(500).send('Error capturing payment.');
    }
});

// Payment cancel route
app.get('/payment/cancel/:adoptionId', async (req, res) => {
    const { adoptionId } = req.params;

    try {
        console.log("Canceling payment for adoptionId:", adoptionId);

        // Optionally update the payment status to canceled
        const adoption = await Adoption.findById(adoptionId);
        if (!adoption) {
            return res.status(404).send('Adoption not found');
        }

        await Adoption.findByIdAndUpdate(adoptionId, { paymentStatus: 'Canceled' });
        res.status(200).send('Payment canceled. You can try again.');
    } catch (error) {
        console.error('Error canceling payment:', error);
        res.status(500).send('Error canceling payment.');
    }
});



// Start the server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
