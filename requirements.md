Raffle Registration & Draw System
Overview
This project is a cross-platform raffle system with a unified backend and dual frontend (web + mobile) support. It allows users to register using their account details and enables administrators to conduct random raffle draws, validate winners, and record prize distribution — all while supporting regional filtering.
The system is designed for real-time event use (e.g., power utility raffles, promotional campaigns) where live registration and live draws are required.
________________________________________
Tech Stack
Layer	Technology
Frontend (Web & Mobile)	Ionic 8 + Angular
Backend	NestJS (Node.js Framework)
Database	Microsoft SQL Server
	
API Format	REST
Deployment Target	Web browser (admin panel), Mobile devices (registration or portable admin use)
________________________________________
Core Modules
0. Authentication Module
•	Create a simple login page (local for now simple)
•	User can only access the registration page, while admin can access all (raffle,reporting, adding of users)	
1. Registration Module
•	Users register by providing AccountNumber, or ConsumerName.
•	Data is verified against the accountmaster table.
•	Validated users are stored in a registrants table along with timestamp and location.
2. Raffle Module
•	Admin initiates a draw by:
o	Selecting a prize name
o	Setting the number of winners
o	Applying optional filters (Town, Area, District)
•	System randomly selects non-winner, eligible registrants.
•	Admin manually confirms winners (✔️ present, ❌ not eligible).
•	Each result updates the registrants table accordingly with:
o	Winner status
o	Prize details
o	Timestamp of pick
3. USERS Module
•	Can only accessed by admin
•	Can create users 
________________________________________
 System Flow
Registration Flow:
1.	User enters their account details.
2.	System verifies against accountmaster.
3.	If valid and not yet registered, user is added to registrants. And determine their district based on the municipality code of the registrant on the accountmaster table. It will also determine the area of the registrant depending on the area code on the accountmaster table
4.	Timestamp and location are recorded.
Raffle Draw Flow:
1.	Admin sets:
o	Prize name
o	Number of winners
o	Optional filters (town, area, district)
2.	System randomly selects N eligible, unpicked registrants.
3.	Display list with check (✔️) and x (❌) buttons.
4.	Admin confirms each winner:
o	✔️ = eligible winner (mark with prize and timestamp)
o	❌ = not eligible (mark status accordingly)
5.	Results are stored and can be exported/viewed.
________________________________________
Project Structure & Setup (No Code Yet)
Phase 1: Backend Setup (NestJS + MS SQL)
•	Scaffold NestJS project with modules:
o	registration
o	raffle
•	Set up MSSQL connection using TypeORM 
•	Define database schema:
o	accountmaster (existing)
o	registrants (new)
Phase 2: Frontend Setup (Ionic + Angular)
•	Scaffold Ionic 8 app
•	Create views/pages:
o	RegistrationPage (user form)
o	RaffleDrawPage (admin panel)
o	WinnerConfirmationPage (manual winner validation)
•	Connect to backend via REST API
Phase 3: Features Development
•	Registration:
o	Form validation
o	API call to /register
o	Success/error display
•	Raffle Draw:
o	Admin UI to initiate draw
o	Display of selected registrants
o	Check/X buttons + bulk actions
o	Final confirmation updates via API
•	Reporting
o	Can generate a report of the registrants, that can be arranged depending on fields
o	Can generate a report of winners and prizes they have won
o	Create a different view for the  number of current registrant grouped by town 
Phase 4: Deployment
•	Web version: localhost for now using IIS or APACHE
•	Mobile version: Deploy via Android/iOS if needed using Capacitor
•	Create environment variables for connecting to database and other parts that needs env 
________________________________________
 Future Enhancements
•	Authentication for admin panel
•	Prize inventory management
•	PDF export or result printing
•	Audit logs and tracking
•	Real-time syncing with sockets

