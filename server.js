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
const { client, paypal } = require('./config/paypal'); // Adjust the path as necessary
const Adoption = require('./Model/adoption'); // Adjust the path based on your file structure
const router = express.Router();
const { deletePet } = require('./servers/addPetController');
const { exec } = require('child_process');
const bodyParser = require('body-parser');
const sgMail = require('@sendgrid/mail');
require('dotenv').config({ path: './secret.env' });


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
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


// MongoDB connection
const MONGODB_URI = "mongodb://127.0.0.1:27017/petAdoption";
mongoose.connect(MONGODB_URI)
.then(() => {
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

        const isMatch = await bcrypt.compare(password, user.password);
        console.log("Login Successfull", isMatch);

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

app.post('/adoptpet/:petId', async (req, res) => {
    const petId = req.params.petId;
    const { customerName, email, phone, paymentStatus, paymentDetails } = req.body;

    // Validate incoming data
    if (!customerName || !email || !phone || !paymentStatus) {
        return res.status(400).json({ message: 'Invalid input data' });
    }

    // Check if the pet exists and retrieve its owner ID
    const pet = await Pet.findById(petId).populate('owner'); // Ensure you have a reference to the pet owner
    if (!pet) {
        return res.status(404).json({ message: 'Pet not found' });
    }

    const newAdoption = new Adoption({
        customerName,
        email,
        phone,
        petId,
        petOwnerId: pet.owner._id, // Include the pet owner's ID
        paymentStatus, // This should reflect the payment status (e.g., 'Completed' or 'Pending')
        paymentDetails: paymentDetails || {}, // Use provided payment details or an empty object
    });

    try {
        const adoption = await newAdoption.save();
        console.log('Adoption saved successfully:', adoption); // Log adoption details
        res.status(200).json({ message: 'Adoption details saved successfully', adoption });
    } catch (err) {
        console.error('Error saving adoption details:', err);
        res.status(500).json({ message: 'Error saving adoption details', error: err.message });
    }
});

// Endpoint to handle bug report submissions
app.post('/submit-bug-report', (req, res) => {
    // Log incoming request data
    console.log('Received request to submit bug report:', req.body);

    const userName = req.body.name; // Make sure you use the correct field names
    const userEmail = req.body.email;
    const bugDescription = req.body.description;

    // Log the values extracted from the request
    console.log('User Name:', userName);
    console.log('User Email:', userEmail);
    console.log('Bug Description:', bugDescription);

    const scriptPath = './script.sh';
    const subject = 'Bug Report Submitted';
    const content = `Dear ${userName},\n\nThank you for reporting a bug. Here are the details:\n\nDescription: ${bugDescription}\n\nThank You,\nTeam RescuePaws`;
    const sendgridApiKey = process.env.SENDGRID_API;

    // Log the command being executed
    const command = `bash "${scriptPath}" "${userEmail}" "${subject}" "${content.replace(/\n/g, '\\n')}" "${sendgridApiKey}"`;
    console.log('Executing command:', command);

    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error executing script: ${error.message}`);
            return res.status(500).send('Error sending bug report email.');
        }

        if (stderr) {
            console.error(`Error output: ${stderr}`);
            return res.status(500).send('Error sending bug report email.');
        }

        // Log the stdout from the script
        console.log('Script output:', stdout);

        // If email is sent successfully
        res.status(200).send('Bug report submitted successfully!');
    });
});


// Start the server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
