#  UMSSN E-VOTING SYSTEM

> A free, fast and secure method of voting for Uganda Martyrs SS Namugongo
---
## Overview

UMSSN E-voting system is a system designed to make elections faster and more secure and eradicate cases of ballot stuffing and rigging of elections.

Built with scalability, security and modern UX design in mind.
---
## Features

- User authentication
  - Use of a voter ID (VJA-V3V1E9)
  - Username and password to access the admin section
- Candidate registration
- Secure voting
- One vote per user
- Admin management panel
- Live results display
- Modern UI
 ---
## Tech stack
` frontend/` - React, pages, styles
` backend/` - Express server, routes, SQLite database
 
---
## Installation
 
### Clone the repository
```bash
   git clone https://github.com/Apsco-app/e-voting.git
``` 
### Install dependencies
```bash
   npm install
```
### Configure environment variables in the backend folder(create .env file in the backend folder)
``` env
    JWT_SECRET=
    ADMIN_USER=
    ADMIN_PASS=
```
### Run the backend
```bash
    cd backend
```
```bash
    npm install
```
``` bash
    npm run seed 
```
``` bash
    npm start
```
### Run the development server in another terminal
```bash
    cd frontend
```
```bash
    npm install
```
``` bash 
    npm run dev
```
---
## Security
 Security is a key feature of the UMSSN e-voting system
 
 Implimented protections include:
 - [x] JWT authentication
 - [x] Password hashing
 - [x] Rate limiting
 - [x] SQL injection prevention
 - [x] Environment variable protection

---
## Usage
1.	Sign in to the system.
2.	View the list of candidates.
3.	Select your preferred candidate.
4.	Confirm your vote.
5.	Wait for the results by the admin.
---

## Contributing

Pull requests are welcome.

For major changes, please open an issue first to discuss what you would like to change.

---

## License

This project is under the MIT License 
© 2026 Nkono Jeremie

---
## Author

#### Nkono Jeremie 
- GitHub: https://github.com/Apsco-app/e-voting
- Instagram: https://instagram.com/real_jeremienkono
- Email: jeremienkono1@gmail.com
