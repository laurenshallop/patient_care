const router = require('express').Router();
const { User, Post, Vote, Comment } = require('../../models');
const passportAuth = require('../../utils/auth');
const passport = require('../../utils/passport');
const LocalStrategy = require('passport-local').Strategy;


// GET /api/users
// http://localhost:3001/api/users
router.get('/',  (req, res) => {
    // access our user model and run .findAll() method -- similar to SELECT * FROM users;
    User.findAll({
        attributes: { exclude: ['[password']}
    })
    .then(dbUserData => res.json(dbUserData))
    .catch(err => {
        console.log(err); 
        res.status(500).json(err);
    });
});

// GET /api/users/1
// http://localhost:3001/api/users/1
router.get('/:id', (req, res) => {
    User.findOne({
        attributes: { exclude: ['password'] },
        where: {
          id: req.params.id
        },
        include: [
          {
            model: Post,
            attributes: ['id', 'post_text', 'created_at']
          },
          {
            model: Comment,
            attributes: ['id', 'comment_text', 'created_at'],
          },
          {
            model: Post,
            attributes: ['post_text'],
            through: Vote,
            as: 'voted_posts'
          }
       ]
      })
        .then(dbUserData => {
            if (!dbUserData) {
                res.status(404).json({ message: 'No user found with this id'});
                return;
            }
            res.json(dbUserData);
        })
        .catch(err => {
            console.log(err);
            res.status(500).json(err);
        });
});


// POST /api/users
// http://localhost:3001/api/users
router.post('/', (req, res) => {
    User.create({
        username: req.body.username,
        email: req.body.email,
        password: req.body.password,
 
    })
    // prior to passport, we store to session, but with passport we must login to enable package
    .then(dbUserData => {
        console.log(dbUserData);
        res.redirect('/login')      
        });
});


// login using passport methods
router.post('/login', passport.authenticate('local'), function(req, res) {
    res.render('homepage', 
    {loggedIn: req.session.passport.user.id});
});


// Logout using passport methods
router.post('/logout', function(req, res,) {
    req.logout();
    res.redirect('/');
  });


// PUT /api/users/1 - similar to UPDATE 
router.put('/:id', passportAuth, (req, res) => {
    User.update(req.body, {
        individualHooks: true,
        where: {
            id: req.params.id
        }
    })
    .then(dbUserData => {
        if (!dbUserData[0]) {
            res.status(404).json({ message: 'No user found with this id'});
            return;
        }
        res.json(dbUserData);
    })
    .catch(err => {
        console.log(err); 
        res.status(500).json(err);
    });

});


// DELETE /api/users/1
router.delete('/:id', passportAuth, (req, res) => {
    User.destroy({
        where: {
            id: req.params.id
        }
    })
        .then(dbUserData => {
            if (!dbUserData) {
                res.status(404).json({ message: 'No user found with this id'});
                return;
            }
            res.json(dbUserData);
        })
        .catch(err => {
            console.log(err);
            res.status(500).json(err);
        });
});


module.exports = router;
