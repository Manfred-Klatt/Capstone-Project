const swaggerJsdoc = require('swagger-jsdoc');
const fs = require('fs');
const path = require('path');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Animal Crossing Quiz API',
      version: '1.0.0',
      description: 'API documentation for the Animal Crossing Quiz Game',
      contact: {
        name: 'API Support',
        email: 'support@example.com',
      },
    },
    servers: [
      {
        url: 'http://localhost:8000/api/v1',
        description: 'Development server',
      },
      {
        url: 'https://api.ac-quiz.example.com/api/v1',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              description: 'The auto-generated id of the user',
            },
            username: {
              type: 'string',
              description: 'User\'s username',
              minLength: 3,
              maxLength: 20,
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User\'s email',
            },
            role: {
              type: 'string',
              enum: ['user', 'admin'],
              default: 'user',
            },
            avatar: {
              type: 'string',
              description: 'URL to user\'s avatar image',
            },
            highScore: {
              type: 'number',
              default: 0,
            },
            gamesPlayed: {
              type: 'number',
              default: 0,
            },
            totalPoints: {
              type: 'number',
              default: 0,
            },
            active: {
              type: 'boolean',
              default: true,
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        Game: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              description: 'The auto-generated id of the game',
            },
            user: {
              $ref: '#/components/schemas/User',
            },
            category: {
              type: 'string',
              enum: ['villagers', 'fish', 'bugs', 'fossils', 'art'],
            },
            difficulty: {
              type: 'string',
              enum: ['easy', 'medium', 'hard'],
            },
            score: {
              type: 'number',
              minimum: 0,
              maximum: 100,
            },
            correctAnswers: {
              type: 'number',
            },
            totalQuestions: {
              type: 'number',
            },
            timeSpent: {
              type: 'number',
              description: 'Time spent on the game in seconds',
            },
            answers: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  questionId: {
                    type: 'string',
                  },
                  userAnswer: {
                    type: 'string',
                  },
                  correctAnswer: {
                    type: 'string',
                  },
                  isCorrect: {
                    type: 'boolean',
                  },
                  timeSpent: {
                    type: 'number',
                  },
                },
              },
            },
            completedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        Error: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              example: 'error',
            },
            message: {
              type: 'string',
              example: 'Error message',
            },
          },
        },
      },
    },
  },
  apis: [
    './src/api/v1/auth/auth.routes.js',
    './src/api/v1/users/user.routes.js',
    './src/api/v1/game/game.routes.js',
  ],
};

const specs = swaggerJsdoc(options);

// Ensure docs directory exists
const docsDir = path.join(__dirname, '../docs');
if (!fs.existsSync(docsDir)) {
  fs.mkdirSync(docsDir, { recursive: true });
}

// Write the OpenAPI spec to a file
fs.writeFileSync(
  path.join(docsDir, 'openapi.json'),
  JSON.stringify(specs, null, 2)
);

console.log('OpenAPI documentation generated successfully!');
