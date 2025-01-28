#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import shell from 'shelljs';
import { program } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';

// Define available templates
const TEMPLATES = {
    nodejs: {
        name: 'Node.js',
        description: 'A basic Node.js project with Express',
        setup: (projectPath) => {
            // Create folders
            const folders = ['models', 'controllers', 'routes', 'config', 'utils', 'services', 'middleware'];
            folders.forEach((folder) => {
                fs.mkdirSync(path.join(projectPath, folder));
                console.log(chalk.green(`Created folder: ${folder}`));
            });

            // Create index.js
            const indexJsContent = `import express from \"express\";
import dotenv from \"dotenv\";
import { createServer } from \"./server.js\";
import morgan from \"morgan\";
import config from \"./utils/config.js\";

dotenv.config();

const app = express();

// Load environment variables
const PORT = config.PORT || 5000;

// API logs middleware
app.use(morgan(\"dev\"));

// Create server
const server = createServer(app, PORT);


// Start server
server.startServer();`;

            fs.writeFileSync(path.join(projectPath, 'index.js'), indexJsContent);
            console.log(chalk.green('Created file: index.js'));

            // Create server.js
            const serverJsContent = `
import express from \"express\";
import cors from \"cors\";
import cookieParser from \"cookie-parser\";
import session from \"express-session\";
import { logger } from \"./utils/logger.js\";
import config from \"./utils/config.js\";

const createServer = (app, port) => {
  // Middleware setup
  app.use(
    cors({
      origin: config.ALLOWED_ORIGINS,
      credentials: true,
    })
  );
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  app.use(
    session({
      secret: config.SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: config.NODE_ENV === \"production\",
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
      },
    })
  );


  // Routes
  // your all routes will be here 


  // Start server
  const startServer = async () => {
    try {
      // Connect to database
      // code to connect to database goes here

      // Start server
      app.listen(port, () => {
        logger.info(
          \`Server running in \$\{config.NODE_ENV.toUpperCase()} mode on port \$\{port}\`
        );
      });
    } catch (error) {
      logger.error(\"Failed to connect to database:\", error);
      process.exit(1);
    }
  };

  return { startServer };
};

export { createServer };`;
            fs.writeFileSync(path.join(projectPath, 'server.js'), serverJsContent);
            console.log(chalk.green('Created file: server.js'));


            // Create logger.js
            const loggerJsContent = `import winston from "winston";\n
import config from "./config.js";

export const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp({
      format: "ddd, MMM D YYYY : h:mm A",
    }),
    winston.format.colorize(),
    winston.format.printf((info) => {
      return \`\${info.level}: \$\{info.message}  ->  \$\{info.timestamp}\`;
    })
  ),
  // transports: [
  //   new winston.transports.File({ filename: "error.log", level: "error" }),
  //   new winston.transports.File({ filename: "combined.log" }),
  // ],
});

if (config.NODE_ENV !== "production") {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf((info) => {
          return \`\${info.level}: \x1b[33m\$\{info.message}\x1b[0m  ->  \$\{info.timestamp}\`;
        })
      ),
    })
  );
}`
            fs.writeFileSync(path.join(projectPath, 'utils/logger.js'), loggerJsContent);
            console.log(chalk.green('Created file: logger.js'));


            // Create config.js
            const configJsContent = `import dotenv from "dotenv";

// require('dotenv-safe').load();  -> for production

dotenv.config();

export default {
  PORT: process.env.PORT,
  ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS,
  NODE_ENV: process.env.NODE_ENV,
  SESSION_SECRET: process.env.SESSION_SECRET,
};`


            fs.writeFileSync(path.join(projectPath, 'utils/config.js'), configJsContent);
            console.log(chalk.green('Created file: config.js'));
            // Initialize npm and install dependencies
            shell.cd(projectPath);
            shell.exec('npm init -y');
            shell.exec('npm install express dotenv morgan cors cookie-parser express-session passport');
            shell.exec('npm install nodemon -D');
            console.log(chalk.green('Initialized npm project and installed dependencies.'));
        },
    },
};

// Define the CLI command
program
    .version('1.0.0')
    .description('A universal CLI tool to set up project templates')
    .action(async () => {
        try {
            // Prompt the user to select a template
            const { template } = await inquirer.prompt([
                {
                    type: 'list',
                    name: 'template',
                    message: 'Select a template:',
                    choices: Object.keys(TEMPLATES).map((key) => ({
                        name: `${TEMPLATES[key].name} - ${TEMPLATES[key].description}`,
                        value: key,
                    })),
                },
            ]);

            // Prompt the user for the project name
            const { projectName } = await inquirer.prompt([
                {
                    type: 'input',
                    name: 'projectName',
                    message: 'Enter the project name:',
                    validate: (input) => {
                        if (!input) return 'Project name cannot be empty!';
                        if (fs.existsSync(input)) return 'Folder already exists!';
                        return true;
                    },
                },
            ]);

            // Create the project folder
            const projectPath = path.join(process.cwd(), projectName);
            fs.mkdirSync(projectPath);
            console.log(chalk.green(`Created folder: ${projectName}`));

            // Run the template setup
            TEMPLATES[template].setup(projectPath);

            console.log(chalk.bold.blue('\nProject setup complete!'));
        } catch (error) {
            console.error(chalk.red('Error:', error.message));
        }
    });

// Parse command-line arguments
program.parse(process.argv);
