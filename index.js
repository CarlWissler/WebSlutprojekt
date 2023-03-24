const express = require('express');
const app = express();
const session = require('express-session');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require('dotenv').config();


// Connect to MongoDB
mongoose.connect("mongodb://root:root@localhost:27017/")
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.log(err));


const user = new mongoose.Schema({
    username: {
        type: String,
        required: false,
        unique: false,
        minlength: 2,
        maxlength: 15,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        match: /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/i,
    },
    password: {
        type: String,
        required: true,
        minlength: 6,
        maxlength: 100,
    },
    address: {
        type: String,
        maxlength: 20,
    },
    following: [{type: mongoose.Schema.Types.ObjectId, ref: 'User'}],
});


const Users = mongoose.model('User', user);


app.set("view engine", "ejs");
app.use(express.urlencoded({extended: false}));
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {maxAge: 1000 * 60 * 10} // 10 minutes
}));
app.use(express.static("resources"));


function auth(req, res, next) {
    if (req.session.loggedIn) {
        next();
    } else {
        res.status(401).redirect('/sign-in');
    }
}

// GET
app.get("/", (req, res) => {
    res.render("home");
});


app.get('/profile', auth, (req, res) => {
    const userId = req.session.userId;

    // Find the user with the given userId
    Users.findById(userId, (err, user) => {
        if (err) {
            console.log(err);
            res.redirect('/');
        } else {
            // Render the profile view with the user data
            res.render('profile', {data: user});
        }
    });
});


app.get("/sign-in", (req, res) => {
    res.render("sign-in");
});


app.get("/sign-up", (req, res) => {
    res.render("sign-up");
});


app.get('/home-feed', auth, (req, res) => {
    Users.find({}, (error, data) => {
        if (error) {
            console.log(error);
        } else {
            console.log(data);
            res.render('home-feed', {data});
        }
    });
});


app.get('/search', auth, (req, res) => {
    res.render('search');
});

app.get('/search-results', auth, (req, res) => {
    let searchQuery = req.query.search;
    searchQuery = searchQuery.trim();
    Users.find({username: {$regex: new RegExp(searchQuery, "i")}}, (err, users) => {
        if (err) {
            console.log(err);
            res.redirect('/search');
        } else {
            console.log(users)
            res.render('search-results', {users});
        }
    });
});


app.get('/search', auth, (req, res) => {
    const searchQuery = req.query.username;
    res.redirect(`/search-results?username=${searchQuery}`);
});

app.get('/follow', auth, (req, res) => {
    const userId = req.session.userId;

    Users.findById(userId)
        .populate('following', 'username lastname email address')
        .exec((err, user) => {
            if (err) {
                console.log(err);
                res.redirect('/home-feed');
            } else {
                const followingUsers = user.following;
                res.render('follow', {followingUsers});
            }
        });
});


// POST
app.post("/sign-up", (req, res) => {
    console.log(req.body);
    Users.findOne({email: req.body.email}, (error, user) => {
        if (error) {
            console.error(error);
            return res.status(500).send("Internal Server Error");
        }
        if (user) {
            console.log("this email already exists");
            return res.redirect("/");
        }

        bcrypt.genSalt(10, (error, salt) => {
            bcrypt.hash(req.body.password, salt, (error, hashedPassword) => {
                if (error) {
                    console.error(error);
                    return res.status(500).send("Internal Server Error");
                }
                const newUser = new Users({
                    username: req.body.username,
                    lastname: req.body.lastname,
                    email: req.body.email,
                    address: req.body.address,
                    password: hashedPassword,
                });
                newUser.save((error, user) => {
                    if (error) {
                        console.error(error);
                        return res.status(500).send("Internal Server Error");
                    }
                    req.session.loggedIn = true;
                    req.session.userId = user._id;
                    req.session.save();
                    return res.redirect("/home-feed");
                });
            });
        });
    });
});

app.post("/sign-in", (req, res) => {
    console.log(req.body);
    Users.findOne({email: req.body.email}, (error, data) => {
        if (error) {
            console.error(error);
            return res.status(500).send("Internal Server Error");
        }
        if (!data) {
            return res.status(401).send("Wrong email or password");
        }
        if (bcrypt.compareSync(req.body.password, data.password)) {
            req.session.loggedIn = true;
            req.session.userId = data._id;
            req.session.save();
            return res.redirect("/home-feed");
        }
        return res.status(401).send("Wrong email or password");
    });
});

app.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.log(err);
        } else {
            res.redirect('/');
        }
    });
});


app.post('/edit-profile', auth, async (req, res) => {
    const {username, lastname, email, address, password} = req.body;
    const userId = req.session.userId;

    // Check if the new email address already exists in the database
    const existingUser = await Users.findOne({email: email});
    if (existingUser && existingUser._id.toString() !== userId) {
        console.log('This email address is already in use by another user.');
        return res.redirect('/profile');
    }

    // Check if password is not empty
    if (password && password.trim()) {
        // Hash the new password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Update the user's password in the database
        await Users.findByIdAndUpdate(userId, {
            password: hashedPassword,
        });
    }

    // Update the user's profile information in the database
    await Users.findByIdAndUpdate(userId, {
        username, lastname, email, address,
    });

    res.redirect('/profile');
});


app.post('/delete-profile', auth, (req, res) => {
    const userId = req.session.userId;

    Users.findByIdAndDelete(userId, (error, data) => {
        if (error) {
            console.log(error);
            res.redirect('/profile');
        } else {
            console.log(data);
            req.session.destroy((err) => {
                if (err) {
                    console.log(err);
                } else {
                    res.redirect('/');
                }
            });
        }
    });
});

app.post('/follow', auth, (req, res) => {
    const userId = req.session.userId;
    const followingId = req.body.followingId;

    Users.findById(userId, (err, user) => {
        if (err) {
            console.log(err);
            res.redirect('/home-feed');
        } else {
            if (user.following.includes(followingId)) {
                res.redirect('/follow'); // User is already following this user, redirect to follow page
            } else {
                Users.findByIdAndUpdate(userId, {$push: {following: followingId}}, (err, user) => {
                    if (err) {
                        console.log(err);
                        res.redirect('/home-feed');
                    } else {
                        res.redirect('/follow');
                    }
                });
            }
        }
    });
});

app.post('/unfollow', auth, (req, res) => {
    const userId = req.session.userId;
    const followingId = req.body.followingId;

    Users.findByIdAndUpdate(userId, {$pull: {following: followingId}}, (err, user) => {
        if (err) {
            console.log(err);
            res.redirect('/home-feed');
        } else {
            res.redirect('/follow');
        }
    });
});

app.listen(3000, (err) => {
    if (err) {
        console.log(err)
    } else {
        console.log("Server is running on port 3000")
    }
})






