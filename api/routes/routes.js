'use strict';

const express = require('express');

// Construct a router instance.
const router = express.Router();
// Import the models
const User = require('../models').User;
const Course = require('../models').Course;
// Import bcrypt module
const bcrypt = require('bcrypt');
// Import basic-auth module for authentication middleware
const auth = require("basic-auth");

// Handler function to wrap each route.
function asyncHandler(cb) {
  return async (req, res, next) => {
    try {
      await cb(req, res, next);
    } catch (error) {
      // Forward error to the global error handler
      next(error);
    }
  }
}

// Authentication middleware (Code coming from Treehouse rest-api-authentication course)
const authenticateUser = async (req, res, next) => {
  let message;

  res.setHeader('Access-Control-Allow-Credentials', true);

  // Parse the user's credentials from the Authorization header.
  const credentials = auth(req);

  // // If the user's credentials are available
  if (credentials) {
    const user = await User.findOne({ where: { emailAddress: credentials.name } });
    // If a user has been found with the provided emailAddress
    if (user) {
      const authenticated = bcrypt.compareSync(
        credentials.pass,
        user.password,
      );
      if (authenticated) {
        console.log(
          `Authentication successful for user: ${user.emailAddress}`
        );

        req.currentUser = user;
      } else {
        message = `Authentication failure for user: ${user.emailAddress}`;
      }
    } else {
      message = `User not found for user: ${credentials.name}`;
    }
  } else {
    message = 'Auth header not found';
  }

  if (message) {
    console.warn(message);
    res.status(401).json({ message: 'Access Denied' });
  } else {
    next();
  }
}

/* Users Route */

/* GET Users (read) route */
router.get('/users', authenticateUser, asyncHandler(async (req, res) => {
  const users = await User.findOne({
    where: {
      id: req.currentUser.id,
    },
    attributes: ['id', 'firstName', 'lastName', 'emailAddress'],
  });
  res.json(users);
}));

/* POST (create) users route */
router.post('/users', asyncHandler(async (req, res) => {

  // This will contain error messages from manual fields validations.
  const errors = [];

  // Manual validators on on the form fields
  if (!req.body.firstName) {
    errors.push('Please provide a "firstName"');
  }
  if (!req.body.lastName) {
    errors.push('Please provide a "lastName"');
  }
  if (!req.body.emailAddress) {
    errors.push('Please provide an "emailAddress"');
  }

  if (req.body.emailAddress) {
    const checkUniq = await User.findOne({
      where: {
        emailAddress: req.body.emailAddress
      },
    });
    if (checkUniq) {
      errors.push('Please use a unique email address');
    }
  }
  if (!req.body.password) {
    errors.push('Please provide a password');
  }

  if (!req.body.passwordConfirm) {
    errors.push('Please confirm your password');
  }

  if (req.body.password && req.body.passwordConfirm) {
    if (req.body.password !== req.body.passwordConfirm) {
      errors.push("Password don't match");
    }
  }

  if (errors.length) {
      res.status(400).json({errors});
  } else {
    try {
      // Hash the password before saving it to the db
      const hashedPassword = bcrypt.hashSync(req.body.password, 10);
        await User.create({
          firstName: req.body.firstName,
          lastName: req.body.lastName,
          emailAddress: req.body.emailAddress,
          password: req.body.password ? hashedPassword : req.body.password,
        });
        res.location('/').status(201).end();

    } catch(error) {
      throw error;
    }
  }
}));

/* Courses Route */

/* GET Courses (read) route */
router.get('/courses', asyncHandler(async (req, res) => {
  const courses = await Course.findAll({
    // include: [{model: User, attributes: ['id', 'firstName', 'lastName']}],
    attributes: ['id', 'title', 'description', 'estimatedTime', 'materialsNeeded'],
    include: [{model: User, attributes: ['id', 'firstName', 'lastName']}],
  });
  
  res.json(courses);
}));
/* GET a simple Course by id (read) route */
router.get('/courses/:id', asyncHandler(async (req, res) => {
  const course = await Course.findOne({
    where: {
      id: req.params.id,
    },
    // include: [{model: User, attributes: ['id', 'firstName', 'lastName']}],
    attributes: ['id', 'title', 'description', 'estimatedTime', 'materialsNeeded', 'userId'],
    include: [{model: User, attributes: ['id', 'firstName', 'lastName']}],
  });
  if (course) {
    res.json(course);
  } else {
    res.status(404).json({message: "Course was not found."});
  }

}));
/* POST Courses (create) route */
router.post('/courses', authenticateUser, asyncHandler(async (req, res) => {
  try {
    const newCourse = await Course.create({
      title: req.body.title,
      description: req.body.description,
      estimatedTime: req.body.estimatedTime,
      materialsNeeded: req.body.materialsNeeded,
      // It uses the authenticated currentUser id to add it to the course so the user dont need to provide it.
      userId: req.currentUser.id
    });
    res.location(`/courses/${newCourse.id}`).status(201).end();
  } catch(error) {
    if (error.name === 'SequelizeValidationError') {
      const errors = error.errors.map(err => err.message);
      res.status(400).json({ errors });   
    } else {
      throw error;
    }
  }
}));
/* PUT Courses (update) route */
router.put('/courses/:id', authenticateUser, asyncHandler(async (req, res) => {
  try {
    const course = await Course.findByPk(req.params.id);
    if (course) {
      // Checks to see if authenticated user if course's owner
      if (req.currentUser.id !== course.userId) {
        res.status(403).json({message: 'Operation forbidden'});
      } else {
        let errors= [];
        if (!req.body.description) {
          errors.push('Please provide a description');
        }
        if (!req.body.title) {
          errors.push('Please provide a title');
        }

        if(errors.length > 0) {
          res.status(400).json({ errors });
        } else {
            await Course.update({
              title: req.body.title,
              description: req.body.description,
              estimatedTime: req.body.estimatedTime,
              materialsNeeded: req.body.materialsNeeded,
              userId: req.currentUser.id
            }, {
              where: {
                id: req.params.id
              }
            });
            res.location(`/courses/${course.id}`).status(204).end();
        }
      }
    } else {
      res.status(404).json({message: "Course was not found."});
    }
  } catch(error) {
    if (error.name === 'SequelizeValidationError') {
      const errors = error.errors.map(err => err.message);
      res.status(400).json({ errors });   
    } else {
      throw error;
    }
  }
}));
/* DELETE Courses (destroy) route */
router.delete('/courses/:id', authenticateUser, asyncHandler(async (req, res) => {
  const course = await Course.findByPk(req.params.id);
  if (course) {
    // Checks to see if authenticated user if course's owner
    if (req.currentUser.id !== course.userId) {
      res.status(403).json({message: 'Operation forbidden'}).end();
    } else {
      await Course.destroy({
        where: {
          id: req.params.id,
        }
      });
      res.status(204).end();
    }
  } else {
    res.status(404).json({message: "Course was not found."});
  }
}));

module.exports = router;