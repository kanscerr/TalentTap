const express = require('express');
const router = express.Router();
const postModel = require('../../schema/community'); // Import postModel
const userModel = require('../../schema/users'); // Import userModel
const { body, validationResult } = require('express-validator');
const logger = require('../../../logger'); // Import logger
const verifyToken = require('../utils/verifytokens');
const multer = require('multer');
const path = require('path');

// Manually set the filename for logging purposes
const filename = path.basename(__filename);

// Configure multer for file storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/'); // Directory to save uploaded files
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname); // Use the original file name
    }
});

const upload = multer({ storage: storage });

// Create a community post API with optional file upload handling
router.post('/',
    verifyToken, // Token verification middleware
    upload.array('files'), // Middleware to handle file uploads (use `upload.single('file')` for single file)
    [
        body('postTitle').notEmpty().withMessage('Post title is required'),
        body('postDescription').notEmpty().withMessage('Post description is required'),
        body('tags').isArray().withMessage('Tags should be an array'),
        body('tags.*').isString().withMessage('Each tag should be a string'),
        body('projectLink').optional().isURL().withMessage('Project link must be a valid URL'),
        body('experienceLevel').notEmpty().withMessage('Experience level is required'),
        body('preferredRating').optional().isFloat({ min: 0, max: 5 }).withMessage('Preferred rating must be between 0 and 5'),
        body('location').optional().isString().withMessage('Location must be a string')
    ],
    async (req, res) => {
        const { postTitle, postDescription, tags, projectLink, experienceLevel, preferredRating, location } = req.body;
        const userID = req.user.userID;

        try {
            // Find the user by userID from the token
            const user = await userModel.findOne({ 'personalDetail.userID': userID });

            if (!user) {
                logger.error({ message: `User not found for userID: ${userID}`, filename });
                return res.status(400).json({ error: 'User not found!' });
            }

            // Debug logs for received data
            logger.info({ message: `Received data - postTitle: ${postTitle}, postDescription: ${postDescription}, tags: ${tags}, projectLink: ${projectLink}, experienceLevel: ${experienceLevel}, preferredRating: ${preferredRating}, location: ${location}`, filename });

            // Check if req.files is defined
            const fileAttachments = req.files ? req.files.map(file => ({
                filename: file.originalname,
                url: `http://localhost:3000/uploads/${file.filename}` // Adjust the URL as needed
            })) : []; // Use an empty array if no files are uploaded

            // Create a new community post
            const newPost = new postModel({
                postTitle,
                opID: user.personalDetail.userID, 
                opName: user.personalDetail.username, 
                postDescription,
                tags,
                projectLink,
                experienceLevel,
                preferredRating, 
                location, 
                fileAttachments, 
                creationDate: new Date(),
                lastUpdated: new Date(),
                isClosed: false,
                visibility: 'Public',
                status: 'Published'
            });

            // Save the post
            await newPost.save();

            logger.info({ message: `Post created successfully for userID: ${userID}`, filename });
            res.status(201).json({ message: 'Post created successfully!', post: newPost });
        } catch (error) {
            logger.error({ message: `Error creating post for userID: ${userID}, Error: ${error.message}`, filename });
            res.status(500).json({ error: 'Internal server error' });
        }
    }
);

module.exports = router;
