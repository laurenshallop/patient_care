const router = require('express').Router();
const sequelize = require('../../config/connection');
const { Post, User, Vote, Comment } = require('../../models');
const passportAuth = require('../../utils/auth');


// get all posts; GET "/api/posts"
router.get('/', (req,res)=>{
    console.log('================================');
    Post.findAll({
        attributes: [
            'id', 
            // 'title', 
            'post_text', 
            'created_at',
            [sequelize.literal('(SELECT COUNT(*) FROM vote WHERE post.id = vote.post_id)'), 'vote_count']
        ],
        order: [['created_at', 'DESC']],
        include: [
            {
                model: User,
                attributes: ['id','username', 'email',]
            },
            {
                model: Comment,
                attributes: [
                    'id',
                    'comment_text',
                    'post_id',
                    'user_id',
                    'created_at'
                ]
            }
        ]
    })
    .then(dbPostData => res.json(dbPostData))
    .catch(err => {
        console.log(err);
        res.status(500).json(err);
    });

});


// get a single pot by ID; GET /api/post/1
router.get('/:id', (req,res)=>{
    Post.findOne({
        where: {
            id: req.params.id
        },
        attributes: [
            'id', 
            // 'title', 
            'post_text', 
            'created_at',
            [sequelize.literal('(SELECT COUNT(*) FROM vote WHERE post.id = vote.post_id)'), 'vote_count']
        ],
        include: [
            {
                model: User,
                attributes: ['username']

            },
            {
                model: Comment,
                attributes: [
                    'id',
                    'comment_text',
                    'post_id',
                    'user_id',
                    'created_at'
                ]
            }
        ]
        
    })
    .then(dbPostData => {
        if(!dbPostData){
            res.status(404).json({ message: 'No post found with this id'});
            return;
        }
        res.json(dbPostData);
    })
    .catch(err => {
        console.log(err);
        res.status(500).json(err);
    });
});


router.post('/test', (req, res) => {
    res.status(200).json('test success!')
})


// create a post; POST /api/posts
router.post(
    '/', 
    passportAuth, 
    (req,res)=>{
    //expects {post_text, user_id}
    console.log('REQUEST BODY:', req.body)
    Post.create({
        post_text: req.body.post_text,
        user_id: req.session.passport.user.id,
    })
    .then(dbPostData => {
        //res.json(dbPostData)
        res.redirect('/')
    })
    .catch(err => {
        console.log(err);
        res.status(500).json(err);
    });

});


// PUT /api/posts/upvote
router.put('/vote', passportAuth, (req, res) => {
    // make sure the session exists first
    if (req.session.passport) {
      // pass session.passport id along with all destructured properties on req.body
      Post.vote({ ...req.body, user_id: req.session.passport.user.id }, { Vote, Comment, User })
        .then(updatedVoteData => res.json(updatedVoteData))
        .catch(err => {
          console.log(err);
          res.status(500).json(err);
        });
    }
  });
  

//update a post  PUT /api/posts/1 
router.put('/:id', (req,res) => {
    //expects {post_text}
    Post.update(
        {
            post_text: req.body.post_text
        },
        {
        where: {
            id: req.params.id
        }
    })
    .then(dbPostData => {
        if(!dbPostData) {
            req.json(404).json({ message: 'No post found with this id' });
            return;
        }
        res.json(dbPostData);
    })
    .catch(err => {
        console.log(err);
        res.status(500).json(err);
    });
});


//delete a post; DELETE /api/posts/1 
router.delete('/:id', passportAuth, (req,res)=>{
    Post.destroy({
        where: {
            id: req.params.id
        }
    })
    .then(dbPostData => {
        if(!dbPostData){
            res.status(404).json({ message: 'No post' });
            return;
        }
        res.json(dbPostData);
    })
    .catch(err => {
        console.log(err);
        res.status(500).json(err);
    });
});


module.exports = router;