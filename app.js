const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const session = require('express-session');
const bcrypt = require('bcrypt');
const { check, validationResult } = require('express-validator');
const path = require('path');

const app = express();
app.setMaxListeners(15);

const PORT = process.env.PORT || 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(session({ secret: 'your-secret-key', resave: true, saveUninitialized: true }));

mongoose.connect('mongodb://localhost:27017/hotelmanagement123', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(() => {
        console.log('Connected to MongoDB');
    })
    .catch((error) => {
        console.error('Error connecting to MongoDB:', error);
    });

const User = mongoose.model('User', new mongoose.Schema({
    name: { type: String, required: true },
    mobile: { type: String, required: true },
    age: { type: Number, required: true },
    username: { type: String, unique: true, required: true },
    password: { type: String, required: true }
}));

const Booking = mongoose.model('Booking', new mongoose.Schema({
    customerName: { type: String, required: true },
    roomType: { type: String, required: true },
    bedNo: { type: String, required: true },  // Add this line for bed number
    checkInDate: { type: Date, required: true },
    checkOutDate: { type: Date, required: true },
    totalAdults: { type: Number, required: true },
    totalChildren: { type: Number, required: true },
    price: { type: Number, required: true },
}));


app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'home.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'login.html'));
});

app.get('/signup', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'signup.html'));
});

app.get('/adminlogin', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'adminlogin.html'));
});

// ... (previous code)

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'admin.html'));
});

// Remove the previous /admin post route

// ... (remaining code)


app.post('/signup', [
    check('name').notEmpty().withMessage('Name is required'),
    check('mobile').notEmpty().withMessage('Mobile number is required'),
    check('age').notEmpty().withMessage('Age is required'),
    check('username').isAlphanumeric().withMessage('Username can only contain letters and numbers'),
    check('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
], async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).render('signup', { errors: errors.array() });
    }

    const { name, mobile, age, username, password } = req.body;

    try {
        const hashedPassword = bcrypt.hashSync(password, 10);
        const user = new User({ name, mobile, age, username, password: hashedPassword });

        await user.save();

        res.redirect('/login');
    } catch (error) {
        console.error('Error saving user to MongoDB:', error);
        res.status(500).send('Internal Server Error');
    }
});

app.post('/login', [
    check('username').isAlphanumeric().withMessage('Username can only contain letters and numbers'),
    check('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
], async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).render('login', { errors: errors.array() });
    }

    const { username, password } = req.body;

    try {
        const user = await User.findOne({ username });

        if (user && bcrypt.compareSync(password, user.password)) {
            req.session.user = user;
            res.redirect('/booking');
        } else {
            res.render('login', { errors: [{ msg: 'Invalid username or password' }] });
        }
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).send('Internal Server Error');
    }
});

// ... (previous code)

app.post('/adminlogin', [
    check('username').isAlphanumeric().withMessage('Username can only contain letters and numbers'),
    check('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
], async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).render('adminlogin', { errors: errors.array() });
    }

    const { username, password } = req.body;

    // Check if the provided credentials are admin/password
    if (username === 'admin' && password === 'password') {
        req.session.user = { username: 'admin' }; // Store user information in the session
        res.redirect('/admin');
    } else {
        res.render('adminlogin', { errors: [{ msg: 'Invalid username or password' }] });
    }
});

// ... (remaining code)


app.get('/booking', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }
    res.sendFile(path.join(__dirname, 'views', 'booking.html'));
});

app.post('/booking', async (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }

    const {
        visitor_name,
        visitor_email,
        visitor_phone,
        total_adults,
        total_children,
        checkin,
        checkout,
        room_type,
        beds,  // Add this line to extract the beds value
        price
    } = req.body;

    try {
        const booking = new Booking({
            customerName: visitor_name,
            roomType: room_type,
            bedNo: beds,  // Assign the beds value to bedNo
            checkInDate: new Date(checkin),
            checkOutDate: new Date(checkout),
            totalAdults: parseInt(total_adults),
            totalChildren: parseInt(total_children),
            price: parseFloat(price),
        });

        await booking.save();

        res.send('Booking successful!');
    } catch (error) {
        console.error('Error saving booking to MongoDB:', error);
        res.status(500).send('Internal Server Error');
    }
});


app.get('/admin', async (req, res) => {
    try {
        const bookings = await Booking.find();
        const users = await User.find();
        res.render('admin', { bookings, users });
    } catch (error) {
        console.error('Error fetching data from MongoDB:', error);
        res.status(500).send('Internal Server Error');
    }
});

app.get('/admin/getUsers', async (req, res) => {
    try {
        const users = await User.find();
        res.json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get('/admin/getBookings', async (req, res) => {
    try {
        const bookings = await Booking.find();
        res.json(bookings);
    } catch (error) {
        console.error('Error fetching bookings:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
// ... (remaining code)

app.get('/admin/getUsers', async (req, res) => {
    try {
        const users = await User.find();
        res.json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get('/admin/getBookings', async (req, res) => {
    try {
        const bookings = await Booking.find();
        res.json(bookings);
    } catch (error) {
        console.error('Error fetching bookings:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.delete('/admin/deleteUser/:id', async (req, res) => {
    const userId = req.params.id;

    try {
        const deletedUser = await User.findByIdAndDelete(userId);

        if (deletedUser) {
            res.json(deletedUser);
        } else {
            res.status(404).json({ error: 'User not found' });
        }
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.delete('/admin/deleteBooking/:id', async (req, res) => {
    const bookingId = req.params.id;

    try {
        const deletedBooking = await Booking.findByIdAndDelete(bookingId);

        if (deletedBooking) {
            res.json(deletedBooking);
        } else {
            res.status(404).json({ error: 'Booking not found' });
        }
    } catch (error) {
        console.error('Error deleting booking:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// ... (previous imports and setup) ...

// Update the existing '/admin/getUsers' endpoint
app.get('/admin/getUsers', async (req, res) => {
    try {
        const users = await User.find();
        res.json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Update the existing '/admin/getBookings' endpoint
app.get('/admin/getBookings', async (req, res) => {
    try {
        const bookings = await Booking.find();
        res.json(bookings);
    } catch (error) {
        console.error('Error fetching bookings:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Add a new endpoint for updating a user
// app.js

// ... (previous code)

app.get('/admin/updateUser/:id', async (req, res) => {
    const userId = req.params.id;

    try {
        const user = await User.findById(userId);

        if (user) {
            res.render('update_user', { user });
        } else {
            res.status(404).send('User not found');
        }
    } catch (error) {
        console.error('Error fetching user for update:', error);
        res.status(500).send('Internal Server Error');
    }
});

app.get('/admin/updateUser/:id', async (req, res) => {
    const userId = req.params.id;

    try {
        const user = await User.findById(userId);

        if (user) {
            res.render('update_user', { user });
        } else {
            res.status(404).send('User not found');
        }
    } catch (error) {
        console.error('Error fetching user for update:', error);
        res.status(500).send('Internal Server Error');
    }
});

app.get('/admin/updateUser/:id', async (req, res) => {
    const userId = req.params.id;

    try {
        const user = await User.findById(userId);

        if (user) {
            res.render('update_user', { user });
        } else {
            res.status(404).send('User not found');
        }
    } catch (error) {
        console.error('Error fetching user for update:', error);
        res.status(500).send('Internal Server Error');
    }
});

app.post('/admin/updateUser/:id', async (req, res) => {
    const userId = req.params.id;
    const { name, mobile, age, username } = req.body;

    try {
        const updatedUser = await User.findByIdAndUpdate(userId, { name, mobile, age, username }, { new: true });

        if (updatedUser) {
            res.redirect('/admin'); // Redirect to the admin page after successful update
        } else {
            res.status(404).send('User not found');
        }
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).send('Internal Server Error');
    }
});

// ... (remaining code)

// ... (previous code)

app.get('/admin/updateBooking/:id', async (req, res) => {
    const bookingId = req.params.id;

    try {
        const booking = await Booking.findById(bookingId);

        if (booking) {
            res.render('update_booking', { booking });
        } else {
            res.status(404).json({ error: 'Booking not found' });
        }
    } catch (error) {
        console.error('Error fetching booking:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.post('/admin/updateBooking/:id', async (req, res) => {
    const bookingId = req.params.id;
    const { customerName, roomType, bedNo, checkInDate, checkOutDate, totalAdults, totalChildren, price } = req.body;

    try {
        const updatedBooking = await Booking.findByIdAndUpdate(bookingId, {
            customerName,
            roomType,
            bedNo,
            checkInDate: new Date(checkInDate),
            checkOutDate: new Date(checkOutDate),
            totalAdults: parseInt(totalAdults),
            totalChildren: parseInt(totalChildren),
            price: parseFloat(price),
        }, { new: true });

        if (updatedBooking) {
            res.redirect('/admin'); // Redirect to the admin page after successful update
        } else {
            res.status(404).json({ error: 'Booking not found' });
        }
    } catch (error) {
        console.error('Error updating booking:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// ... (remaining code)




app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

